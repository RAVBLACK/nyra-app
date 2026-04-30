import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, Avatar, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from '../contexts/DarkModeContext';

// SVG: Person
function PersonSvg({ size = 22, color = '#6b7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx="14" cy="9" r="5" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Path d="M5 26 C5 20 9 17 14 17 C19 17 23 20 23 26" stroke={color} strokeWidth="2" strokeLinecap="round" fill={color + '10'} />
    </Svg>
  );
}

// SVG: Phone
function PhoneSvg({ size = 22, color = '#6b7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M6 4 C6 4 8 2 10 4 L12 8 C12 8 12 10 10 11 C10 11 12 16 17 17 C18 16 20 16 20 16 L24 18 C26 20 24 22 24 22 C22 24 18 26 12 20 C6 14 4 8 6 4Z" fill={color + '15'} stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// SVG: Email
function EmailSvg({ size = 22, color = '#6b7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x="3" y="6" width="22" height="16" rx="3" fill={color + '15'} stroke={color} strokeWidth="1.5" />
      <Path d="M3 8 L14 16 L25 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// SVG: Pencil
function PencilSvg({ size = 18, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" fill={color + '15'} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <Line x1="13" y1="6" x2="18" y2="11" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// SVG: Check
function CheckSvg({ size = 18, color = '#4CAF50' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={color + '20'} stroke={color} strokeWidth="1.5" />
      <Path d="M7 12 L10.5 15.5 L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const n = await AsyncStorage.getItem('nyra_userName');
      const p = await AsyncStorage.getItem('nyra_phoneNumber');
      const e = await AsyncStorage.getItem('nyra_email');
      if (n) setName(n); if (p) setPhone(p); if (e) setEmail(e);
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('nyra_userName', name.trim());
      await AsyncStorage.setItem('nyra_phoneNumber', phone.trim());
      await AsyncStorage.setItem('nyra_email', email.trim());
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) { Alert.alert('Error', 'Could not save profile.'); }
  };

  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NY';
  const bgColor = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  const fields = [
    { key: 'name', label: 'Full Name', value: name, setter: setName, keyboard: 'default', SvgIcon: PersonSvg },
    { key: 'phone', label: 'Phone Number', value: phone, setter: setPhone, keyboard: 'phone-pad', SvgIcon: PhoneSvg },
    { key: 'email', label: 'Email', value: email, setter: setEmail, keyboard: 'email-address', SvgIcon: EmailSvg },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar.Text size={90} label={initials} style={{ backgroundColor: theme.colors.primary }} color="#fff" />
          <Text variant="headlineSmall" style={[styles.profileName, { color: textColor }]}>{name || 'Set your name'}</Text>
          <Text variant="bodyMedium" style={{ color: subColor }}>{phone || 'Add phone number'}</Text>
        </View>

        {/* Profile Info */}
        <Card style={[styles.card, { backgroundColor: cardBg }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: textColor }]}>Personal Information</Text>
              <Button mode="text" compact onPress={() => editing ? handleSave() : setEditing(true)}
                icon={() => editing ? <CheckSvg size={18} color="#4CAF50" /> : <PencilSvg size={18} color={theme.colors.primary} />}>
                {editing ? 'Save' : 'Edit'}
              </Button>
            </View>

            <Divider style={{ marginBottom: 16, backgroundColor: isDarkMode ? '#333' : '#e8e8e8' }} />

            {fields.map((field) => (
              <View key={field.key} style={styles.fieldRow}>
                <field.SvgIcon size={22} color={subColor} />
                {editing ? (
                  <TextInput label={field.label} value={field.value} onChangeText={field.setter}
                    mode="outlined" keyboardType={field.keyboard} style={styles.input} dense />
                ) : (
                  <View style={styles.fieldTextContainer}>
                    <Text style={[styles.fieldLabel, { color: subColor }]}>{field.label}</Text>
                    <Text style={[styles.fieldValue, { color: textColor }]}>{field.value || 'Not set'}</Text>
                  </View>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  profileName: { fontWeight: '700', marginTop: 14, marginBottom: 4 },
  card: { borderRadius: 16, elevation: 2, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontWeight: '600' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 },
  fieldTextContainer: { flex: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  input: { flex: 1 },
});
