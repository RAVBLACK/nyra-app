import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert, Linking } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import { useDarkMode } from '../contexts/DarkModeContext';

// SVG: Bell notifications
function NotifSvg({ size = 24, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M12 14 C12 9 13.5 5 16 5 C18.5 5 20 9 20 14 L21.5 22 L10.5 22 L12 14Z" fill={color + '20'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="9" y1="22" x2="23" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M14 24 C14 26 15 27 16 27 C17 27 18 26 18 24" stroke={color} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

// SVG: Moon (dark mode)
function MoonSvg({ size = 24, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M22 16 C22 21.5 17.5 26 12 26 C10 26 8.2 25.4 6.7 24.4 C9 27 12.3 28.5 16 28.5 C22 28.5 26.5 24 26.5 18 C26.5 14.3 25 11 22.4 8.7 C23.4 10.2 24 12 24 14 C24 14.7 23.9 15.4 23.7 16" fill={color + '20'} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// SVG: Vibration
function VibrateSvg({ size = 24, color = '#9C27B0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="10" y="4" width="12" height="24" rx="3" fill={color + '15'} stroke={color} strokeWidth="2" />
      <Line x1="6" y1="10" x2="6" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="26" y1="10" x2="26" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="13" x2="3" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="29" y1="13" x2="29" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// SVG: Timer/sensitivity
function TimerSvg({ size = 24, color = '#FF9800' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="18" r="11" fill={color + '15'} stroke={color} strokeWidth="2" />
      <Line x1="16" y1="18" x2="16" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// SVG: Info circle
function InfoSvg({ size = 24, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="16" r="12" fill={color + '15'} stroke={color} strokeWidth="2" />
      <Line x1="16" y1="14" x2="16" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="16" cy="10" r="1.5" fill={color} />
    </Svg>
  );
}

// SVG: Trash / reset
function ResetSvg({ size = 24, color = '#EF5350' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M8 10 L24 10 L22 28 L10 28 Z" fill={color + '15'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="6" y1="10" x2="26" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="13" y1="6" x2="19" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="14" x2="14" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="18" y1="14" x2="18" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export default function NewSettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [notifications, setNotifications] = useState(true);
  const [haptic, setHaptic] = useState(true);

  const bg = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  const toggleSettings = [
    { label: 'Notifications', desc: 'Emergency alerts and check-in reminders', SvgIcon: NotifSvg, color: '#1591EA', value: notifications, onToggle: () => setNotifications(!notifications) },
    { label: 'Dark Mode', desc: 'Switch between light and dark theme', SvgIcon: MoonSvg, color: '#6B7280', value: isDarkMode, onToggle: toggleDarkMode },
    { label: 'Haptic Feedback', desc: 'Vibration on buttons and alerts', SvgIcon: VibrateSvg, color: '#9C27B0', value: haptic, onToggle: () => setHaptic(!haptic) },
  ];

  const handleReset = () => {
    Alert.alert('Reset Settings', 'This will reset all settings to default values.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { setNotifications(true); setHaptic(true); Alert.alert('Done', 'Settings have been reset.'); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>Customize your NYRA experience</Text>
        </Animatable.View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>GENERAL</Text>
        {toggleSettings.map((item, i) => (
          <Animatable.View key={i} animation="fadeInUp" delay={100 + i * 80}>
            <Card style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.settingRow}>
                <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                  <item.SvgIcon size={24} color={item.color} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>{item.label}</Text>
                  <Text style={[styles.settingDesc, { color: subColor }]}>{item.desc}</Text>
                </View>
                <Switch value={item.value} onValueChange={item.onToggle}
                  trackColor={{ false: '#ccc', true: theme.colors.primary + '60' }}
                  thumbColor={item.value ? theme.colors.primary : '#f4f4f4'} />
              </Card.Content>
            </Card>
          </Animatable.View>
        ))}

        <Text style={[styles.sectionLabel, { color: subColor, marginTop: 20 }]}>ABOUT</Text>
        <Animatable.View animation="fadeInUp" delay={400}>
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content>
              {/* App Info */}
              <View style={styles.aboutRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#1591EA15' }]}>
                  <InfoSvg size={24} color="#1591EA" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>App Version</Text>
                  <Text style={[styles.settingDesc, { color: subColor }]}>NYRA v1.2.01 (Release)</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]} />

              {/* Developers */}
              <View style={styles.aboutRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#9C27B015' }]}>
                  <Svg width={24} height={24} viewBox="0 0 32 32">
                    <Rect x="4" y="4" width="24" height="24" rx="4" fill="#9C27B020" stroke="#9C27B0" strokeWidth="2" />
                    <Path d="M12 12 L8 16 L12 20" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <Path d="M20 12 L24 16 L20 20" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <Line x1="17" y1="10" x2="15" y2="22" stroke="#9C27B0" strokeWidth="1.5" strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Developers</Text>
                  <Text style={[styles.settingDesc, { color: subColor }]}>Supriya & Rakesh</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]} />

              {/* Description */}
              <View style={styles.aboutRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#4CAF5015' }]}>
                  <Svg width={24} height={24} viewBox="0 0 32 32">
                    <Path d="M16 3 L27 9 V18 C27 26 21 30 16 32 C11 30 5 26 5 18 V9 L16 3Z" fill="#4CAF5020" stroke="#4CAF50" strokeWidth="2" />
                    <Path d="M11 16 L14 19 L21 12" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>About NYRA</Text>
                  <Text style={[styles.settingDesc, { color: subColor }]}>Your personal safety companion. Designed to keep you protected with real-time activity monitoring, emergency alerts, and community support.</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={500} style={{ marginTop: 20 }}>
          <Button mode="outlined" icon={() => <ResetSvg size={20} color={theme.colors.error} />} onPress={handleReset}
            style={styles.resetBtn} textColor={theme.colors.error}>
            Reset All Settings
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
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 16, marginBottom: 10, elevation: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1, marginLeft: 14 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingDesc: { fontSize: 13, marginTop: 2 },
  resetBtn: { borderRadius: 14, paddingVertical: 4, borderColor: '#EF535060' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  divider: { height: 1, marginVertical: 8, marginLeft: 58 },
});
