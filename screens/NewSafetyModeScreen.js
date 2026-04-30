import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useNavigation } from '@react-navigation/native';

// SVG: Walk icon
function WalkSvg({ size = 28, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="7" r="4.5" fill={color} />
      <Path d="M18 14 L22 14 L24 22 L28 30 M16 20 L12 26 M24 22 L19 22 L16 30 L13 38 M21 22 L25 30 L28 38" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// SVG: Map marker alert
function MapAlertSvg({ size = 28, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 4 C12 4 6 10 6 18 C6 28 20 38 20 38 C20 38 34 28 34 18 C34 10 28 4 20 4Z" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Rect x="18" y="12" width="4" height="10" rx="2" fill={color} />
      <Circle cx="20" cy="27" r="2" fill={color} />
    </Svg>
  );
}

// SVG: Bell ring
function BellAlertSvg({ size = 28, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M14 18 C14 12 16 7 20 7 C24 7 26 12 26 18 L28 28 L12 28 L14 18Z" fill={color + '20'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="11" y1="28" x2="29" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M17 30 C17 32 18 34 20 34 C22 34 23 32 23 30" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="7" y1="12" x2="11" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="33" y1="12" x2="29" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export default function NewSafetyModeScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const navigation = useNavigation();
  const [walkMode, setWalkMode] = useState(false);
  const [dangerZones, setDangerZones] = useState(false);
  const [autoAlert, setAutoAlert] = useState(true);

  const bg = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  const features = [
    { title: 'Walk With Me', desc: "Set a timer for your walk. If you don't check in, NYRA alerts your contacts.", SvgIcon: WalkSvg, enabled: walkMode, onToggle: () => setWalkMode(!walkMode) },
    { title: 'Danger Zones', desc: 'Mark areas as unsafe. Get notified when entering these zones.', SvgIcon: MapAlertSvg, enabled: dangerZones, onToggle: () => setDangerZones(!dangerZones) },
    { title: 'Auto-Alert', desc: 'Automatically send emergency SMS when danger is detected.', SvgIcon: BellAlertSvg, enabled: autoAlert, onToggle: () => setAutoAlert(!autoAlert) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <LottieView source={require('../lottiefiles/Shield Up.json')} autoPlay loop style={styles.heroLottie} />
          <Text variant="headlineSmall" style={[styles.heroTitle, { color: textColor }]}>Safety Mode</Text>
          <Text style={[styles.heroSub, { color: subColor }]}>Configure your safety features and stay protected at all times.</Text>
        </View>

        {features.map((f, i) => (
          <Animatable.View key={i} animation="fadeInUp" delay={200 + i * 100}>
            <Card style={[styles.featureCard, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2a2a3e' : '#EEF2FF' }]}>
                  <f.SvgIcon size={28} color={theme.colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: textColor }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: subColor }]}>{f.desc}</Text>
                </View>
                <Switch value={f.enabled} onValueChange={f.onToggle}
                  trackColor={{ false: '#ccc', true: theme.colors.primary + '60' }}
                  thumbColor={f.enabled ? theme.colors.primary : '#f4f4f4'} />
              </Card.Content>
            </Card>
          </Animatable.View>
        ))}

        <Animatable.View animation="fadeInUp" delay={500} style={styles.actions}>
          <Button mode="contained" icon={() => <WalkSvg size={20} color="#fff" />} onPress={() => navigation.navigate('WalkWithMe')} style={styles.actionBtn} labelStyle={styles.actionLabel}>
            Start Walk Timer
          </Button>
          <Button mode="outlined" icon={() => <MapAlertSvg size={20} color={theme.colors.primary} />} onPress={() => navigation.navigate('DangerZones')} style={[styles.actionBtn, { marginTop: 10 }]} labelStyle={styles.actionLabel}>
            Manage Danger Zones
          </Button>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroLottie: { width: 140, height: 140, marginBottom: 8 },
  heroTitle: { fontWeight: '700', marginBottom: 6 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  featureCard: { borderRadius: 16, marginBottom: 14, elevation: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureInfo: { flex: 1, marginLeft: 14 },
  featureTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  featureDesc: { fontSize: 13, lineHeight: 18 },
  actions: { marginTop: 10 },
  actionBtn: { borderRadius: 14, paddingVertical: 6 },
  actionLabel: { fontSize: 15, fontWeight: '600' },
});
