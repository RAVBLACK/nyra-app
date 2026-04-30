import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useDarkMode } from '../contexts/DarkModeContext';

// SVG: Location pin
function LocationSvg({ size = 24, color = '#4CAF50' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 3 C10 3 5 8 5 14 C5 22 16 30 16 30 C16 30 27 22 27 14 C27 8 22 3 16 3Z" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="14" r="4" fill={color} />
    </Svg>
  );
}

// SVG: Background location
function BgLocationSvg({ size = 24, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 3 C10 3 5 8 5 14 C5 22 16 30 16 30 C16 30 27 22 27 14 C27 8 22 3 16 3Z" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="14" r="4" fill={color} />
      <Path d="M4 4 L8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M28 4 L24 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M4 28 L8 24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M28 28 L24 24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// SVG: Bell
function BellSvg({ size = 24, color = '#FF9800' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M12 14 C12 9 13.5 5 16 5 C18.5 5 20 9 20 14 L21.5 22 L10.5 22 L12 14Z" fill={color + '20'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="9" y1="22" x2="23" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M14 24 C14 26 15 27 16 27 C17 27 18 26 18 24" stroke={color} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

// SVG: Accelerometer/sensor
function SensorSvg({ size = 24, color = '#9C27B0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="4" y="4" width="24" height="24" rx="4" fill={color + '15'} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="16" r="3" fill={color} />
      <Line x1="16" y1="8" x2="16" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="16" y1="19" x2="16" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="19" y1="16" x2="24" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// SVG: Check circle
function CheckSvg({ size = 20, color = '#4CAF50' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx="14" cy="14" r="12" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Path d="M9 14 L12.5 17.5 L19 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// SVG: X circle
function DeniedSvg({ size = 20, color = '#EF5350' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx="14" cy="14" r="12" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Line x1="10" y1="10" x2="18" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="18" y1="10" x2="10" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export default function NewPermissionsScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();

  const bg = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  const [permissions, setPermissions] = useState({
    location: null,
    bgLocation: null,
    notifications: null,
  });

  useEffect(() => { checkPermissions(); }, []);

  const checkPermissions = async () => {
    try {
      const loc = await Location.getForegroundPermissionsAsync();
      const bgLoc = await Location.getBackgroundPermissionsAsync();
      const notif = await Notifications.getPermissionsAsync();
      setPermissions({
        location: loc.status === 'granted',
        bgLocation: bgLoc.status === 'granted',
        notifications: notif.status === 'granted',
      });
    } catch (e) {}
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Denied', 'Location permission is required for safety features.'); }
    checkPermissions();
  };

  const requestBgLocation = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Denied', 'Background location is needed for walk monitoring.'); }
    checkPermissions();
  };

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Denied', 'Notifications are needed for check-in alerts.'); }
    checkPermissions();
  };

  const permissionItems = [
    { label: 'Location', desc: 'Required for safety tracking and danger zones', SvgIcon: LocationSvg, color: '#4CAF50', status: permissions.location, onRequest: requestLocation },
    { label: 'Background Location', desc: 'Needed for walk monitoring when app is in background', SvgIcon: BgLocationSvg, color: '#1591EA', status: permissions.bgLocation, onRequest: requestBgLocation },
    { label: 'Notifications', desc: 'For emergency alerts and check-in reminders', SvgIcon: BellSvg, color: '#FF9800', status: permissions.notifications, onRequest: requestNotifications },
    { label: 'Motion Sensors', desc: 'Used for fall detection and activity recognition', SvgIcon: SensorSvg, color: '#9C27B0', status: true /* sensors don't need runtime permission */ },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: textColor }]}>Permissions</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>NYRA needs these permissions to keep you safe.</Text>
        </Animatable.View>

        {permissionItems.map((item, i) => (
          <Animatable.View key={i} animation="fadeInUp" delay={100 + i * 100}>
            <Card style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                  <item.SvgIcon size={24} color={item.color} />
                </View>
                <View style={styles.info}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: textColor }]}>{item.label}</Text>
                    {item.status === true ? <CheckSvg size={20} color="#4CAF50" /> : item.status === false ? <DeniedSvg size={20} color="#EF5350" /> : null}
                  </View>
                  <Text style={[styles.desc, { color: subColor }]}>{item.desc}</Text>
                  <Text style={[styles.statusText, { color: item.status ? '#4CAF50' : '#EF5350' }]}>
                    {item.status === null ? 'Unknown' : item.status ? 'Granted' : 'Not Granted'}
                  </Text>
                </View>
              </Card.Content>
              {item.status === false && item.onRequest && (
                <Card.Actions>
                  <Button mode="contained" compact onPress={item.onRequest} style={styles.grantBtn}>
                    Grant Permission
                  </Button>
                </Card.Actions>
              )}
            </Card>
          </Animatable.View>
        ))}

        <Animatable.View animation="fadeInUp" delay={500} style={{ marginTop: 16 }}>
          <Button mode="outlined" onPress={() => Linking.openSettings()} style={styles.openSettingsBtn} labelStyle={{ fontSize: 14 }}>
            Open Device Settings
          </Button>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontWeight: '700' },
  headerSub: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 16, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  info: { flex: 1, marginLeft: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  statusText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  grantBtn: { borderRadius: 10, marginRight: 8, marginBottom: 8 },
  openSettingsBtn: { borderRadius: 14, paddingVertical: 4 },
});
