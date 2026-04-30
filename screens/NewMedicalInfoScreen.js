import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from '../contexts/DarkModeContext';

const STORAGE_KEY = 'nyra_medical_info';

// SVG: Blood drop
function BloodSvg({ size = 22, color = '#EF5350' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M14 3 C14 3 6 13 6 18 C6 22.4 9.6 26 14 26 C18.4 26 22 22.4 22 18 C22 13 14 3 14 3Z" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Path d="M11 18 C11 16 12.5 14 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// SVG: Warning triangle (allergies)
function AllergySvg({ size = 22, color = '#FF9800' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M14 3 L26 25 L2 25 Z" fill={color + '15'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="14" y1="11" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="14" cy="21.5" r="1.3" fill={color} />
    </Svg>
  );
}

// SVG: Heart pulse
function HeartPulseSvg({ size = 22, color = '#E91E63' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M14 24 C14 24 3 17 3 10 C3 6 6 3 10 3 C12 3 13.5 4 14 5 C14.5 4 16 3 18 3 C22 3 25 6 25 10 C25 17 14 24 14 24Z" fill={color + '15'} stroke={color} strokeWidth="1.5" />
      <Path d="M7 14 L11 14 L13 10 L15 18 L17 14 L21 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// SVG: Pill/medication
function PillSvg({ size = 22, color = '#4CAF50' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x="8" y="3" width="12" height="22" rx="6" fill={color + '15'} stroke={color} strokeWidth="2" />
      <Line x1="8" y1="14" x2="20" y2="14" stroke={color} strokeWidth="2" />
      <Rect x="8" y="14" width="12" height="11" rx="6" fill={color + '30'} stroke="none" />
    </Svg>
  );
}

// SVG: Notepad
function NoteSvg({ size = 22, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x="5" y="3" width="18" height="22" rx="3" fill={color + '15'} stroke={color} strokeWidth="1.5" />
      <Line x1="9" y1="9" x2="19" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="9" y1="14" x2="19" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="9" y1="19" x2="15" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

const FIELD_ICONS = {
  bloodType: BloodSvg,
  allergies: AllergySvg,
  conditions: HeartPulseSvg,
  medications: PillSvg,
  emergencyNotes: NoteSvg,
};

const FIELD_COLORS = {
  bloodType: '#EF5350',
  allergies: '#FF9800',
  conditions: '#E91E63',
  medications: '#4CAF50',
  emergencyNotes: '#1591EA',
};

export default function NewMedicalInfoScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState({
    bloodType: '', allergies: '', conditions: '', medications: '', emergencyNotes: '',
  });

  const bg = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  useEffect(() => { loadInfo(); }, []);

  const loadInfo = async () => {
    try { const s = await AsyncStorage.getItem(STORAGE_KEY); if (s) setInfo(JSON.parse(s)); } catch (e) {}
  };
  const saveInfo = async () => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info)); setEditing(false); Alert.alert('Saved', 'Medical information saved.'); } catch (e) { Alert.alert('Error', 'Could not save.'); }
  };

  const fields = [
    { key: 'bloodType', label: 'Blood Type', placeholder: 'e.g. A+, B-, O+' },
    { key: 'allergies', label: 'Allergies', placeholder: 'e.g. Peanuts, Penicillin' },
    { key: 'conditions', label: 'Medical Conditions', placeholder: 'e.g. Asthma, Diabetes' },
    { key: 'medications', label: 'Current Medications', placeholder: 'e.g. Insulin, Inhaler' },
    { key: 'emergencyNotes', label: 'Emergency Notes', placeholder: 'Any critical info for first responders' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <LottieView source={require('../lottiefiles/HealthTap Spinner.json')} autoPlay loop style={styles.heroLottie} />
          <Text variant="headlineSmall" style={[styles.heroTitle, { color: textColor }]}>Medical Information</Text>
          <Text style={[styles.heroSub, { color: subColor }]}>Store vital health details accessible during emergencies.</Text>
        </View>

        {fields.map((field, i) => {
          const IconComp = FIELD_ICONS[field.key];
          const iconColor = FIELD_COLORS[field.key];
          return (
            <Animatable.View key={field.key} animation="fadeInUp" delay={200 + i * 80}>
              <Card style={[styles.fieldCard, { backgroundColor: cardBg }]}>
                <Card.Content>
                  <View style={styles.fieldHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
                      <IconComp size={24} color={iconColor} />
                    </View>
                    <Text style={[styles.fieldLabel, { color: textColor }]}>{field.label}</Text>
                  </View>
                  {editing ? (
                    <TextInput value={info[field.key]} onChangeText={(v) => setInfo({ ...info, [field.key]: v })}
                      placeholder={field.placeholder} mode="outlined" dense style={styles.input}
                      multiline={field.key === 'emergencyNotes'} />
                  ) : (
                    <Text style={[styles.fieldValue, { color: info[field.key] ? textColor : subColor }]}>
                      {info[field.key] || 'Not set'}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            </Animatable.View>
          );
        })}

        <Animatable.View animation="fadeInUp" delay={600} style={{ marginTop: 8 }}>
          <Button mode="contained" icon={editing ? 'check' : 'pencil'} onPress={editing ? saveInfo : () => setEditing(true)}
            style={styles.actionBtn} labelStyle={styles.actionLabel}>
            {editing ? 'Save Information' : 'Edit Information'}
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
  fieldCard: { borderRadius: 16, marginBottom: 12, elevation: 2 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fieldLabel: { fontSize: 15, fontWeight: '700' },
  fieldValue: { fontSize: 15, marginLeft: 54, marginTop: -4 },
  input: { marginTop: 4 },
  actionBtn: { borderRadius: 14, paddingVertical: 6 },
  actionLabel: { fontSize: 15, fontWeight: '700' },
});
