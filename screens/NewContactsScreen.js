import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, useTheme, FAB, Portal, Dialog, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useContacts } from '../hooks/useContacts';

// SVG X icon for delete
function DeleteXIcon({ size = 28, color = '#EF5350' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="18" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Line x1="14" y1="14" x2="26" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="26" y1="14" x2="14" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export default function NewContactsScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const { contacts, addContact, removeContact } = useContacts();
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const bg = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) { Alert.alert('Error', 'Please fill all fields.'); return; }
    if (contacts.length >= 5) { Alert.alert('Limit', 'Maximum 5 contacts allowed.'); return; }
    const newContact = { id: Date.now().toString(), name: name.trim(), phone: phone.trim() };
    addContact(newContact);
    setName(''); setPhone(''); setShowDialog(false);
  };

  const handleDelete = (contact) => {
    Alert.alert('Remove Contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeContact(contact.id) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <LottieView source={require('../lottiefiles/Phone icon animation.json')} autoPlay loop style={styles.heroLottie} />
          <Text variant="headlineSmall" style={[styles.heroTitle, { color: textColor }]}>Emergency Contacts</Text>
          <Text style={[styles.heroSub, { color: subColor }]}>Add up to 5 trusted people who will be alerted in an emergency.</Text>
        </View>

        {/* Contact Cards */}
        {contacts.length === 0 ? (
          <Animatable.View animation="fadeIn" style={styles.emptyState}>
            <Svg width={64} height={64} viewBox="0 0 64 64">
              <Circle cx="32" cy="22" r="12" fill={subColor + '40'} stroke={subColor} strokeWidth="2" />
              <Line x1="32" y1="34" x2="32" y2="38" stroke={subColor} strokeWidth="2" />
              <Circle cx="20" cy="52" r="0" fill="none" />
              <Line x1="16" y1="54" x2="48" y2="54" stroke={subColor} strokeWidth="2" strokeLinecap="round" />
              <Line x1="20" y1="46" x2="44" y2="46" stroke={subColor} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.emptyText, { color: subColor }]}>No contacts yet. Tap + to add one.</Text>
          </Animatable.View>
        ) : (
          contacts.map((contact, index) => (
            <Animatable.View key={contact.id || index} animation="fadeInUp" delay={index * 100}>
              <Card style={[styles.contactCard, { backgroundColor: cardBg }]}>
                <Card.Content style={styles.contactRow}>
                  <Avatar.Text size={48} label={contact.name ? contact.name.charAt(0).toUpperCase() : '?'} style={{ backgroundColor: theme.colors.primary }} />
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: textColor }]}>{contact.name}</Text>
                    <Text style={[styles.contactPhone, { color: subColor }]}>{contact.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(contact)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <DeleteXIcon size={32} color={theme.colors.error} />
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            </Animatable.View>
          ))
        )}

        <Text style={[styles.limitText, { color: subColor }]}>{contacts.length}/5 contacts</Text>
      </ScrollView>

      {contacts.length < 5 && (
        <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} color="#fff" onPress={() => setShowDialog(true)} />
      )}

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={{ backgroundColor: cardBg, borderRadius: 20 }}>
          <Dialog.Title style={{ color: textColor }}>Add Contact</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="Phone Number" value={phone} onChangeText={setPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAdd}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroLottie: { width: 120, height: 120, marginBottom: 8 },
  heroTitle: { fontWeight: '700', marginBottom: 6 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyState: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { fontSize: 15 },
  contactCard: { borderRadius: 16, marginBottom: 12, elevation: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 14 },
  contactName: { fontSize: 16, fontWeight: '600' },
  contactPhone: { fontSize: 14, marginTop: 2 },
  limitText: { textAlign: 'center', marginTop: 12, fontSize: 13 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 30 },
  input: { marginBottom: 12 },
});
