import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { Text, Button, SegmentedButtons, useTheme, Card, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useDarkMode } from '../contexts/DarkModeContext';
import { walkService } from '../services/walkService';
import { useContacts } from '../hooks/useContacts';

// SVG: Walking person
function WalkSvg({ size = 80, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx="40" cy="14" r="8" fill={color} />
      <Path d="M36 26 L44 26 L47 40 L54 52 M32 38 L24 48 M47 40 L38 40 L32 56 L26 72 M42 40 L48 56 L54 72" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// SVG: Shield check
function ShieldCheckSvg({ size = 28, color = '#4CAF50' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 3 L35 10 V22 C35 32 27 38 20 40 C13 38 5 32 5 22 V10 L20 3Z" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Path d="M13 20 L18 25 L28 15" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// SVG: Bell ring
function BellSvg({ size = 60, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Path d="M30 6 C30 6 30 6 30 6" stroke={color} strokeWidth="2" />
      <Path d="M20 24 C20 16 24 10 30 10 C36 10 40 16 40 24 L42 38 L18 38 L20 24Z" fill={color + '20'} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <Line x1="16" y1="38" x2="44" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M25 42 C25 45 27 48 30 48 C33 48 35 45 35 42" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Line x1="10" y1="16" x2="16" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="50" y1="16" x2="44" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// SVG: Info circle
function InfoSvg({ size = 20, color = '#1976D2' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={color + '15'} stroke={color} strokeWidth="1.5" />
      <Line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.2" fill={color} />
    </Svg>
  );
}

export default function WalkWithMeScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const { contacts } = useContacts();

  const [checkInInputValue, setCheckInInputValue] = useState('5');
  const [checkInUnit, setCheckInUnit] = useState('minutes');
  const [isWalking, setIsWalking] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [timeWalking, setTimeWalking] = useState(0);

  const bg = isDarkMode ? '#121212' : '#F0F4FF';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#1a1a2e';
  const subColor = isDarkMode ? '#b0b0b0' : '#6b7280';

  useEffect(() => {
    let timer;
    if (isWalking) {
      timer = setInterval(() => setTimeWalking(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isWalking]);

  const handleStartWalk = async () => {
    if (!contacts || contacts.length === 0) {
      Alert.alert('No Emergency Contacts', 'Please add emergency contacts before starting a walk.');
      return;
    }
    
    let timeValue = parseFloat(checkInInputValue);
    if (isNaN(timeValue) || timeValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid run time for check-ins.');
      return;
    }

    let intervalMs = checkInUnit === 'minutes' ? timeValue * 60 * 1000 : timeValue * 1000;
    
    // minimum check in time safety check (e.g. at least 10 seconds)
    if (intervalMs < 10000) {
      Alert.alert('Too Short', 'The minimum check-in interval is 10 seconds.');
      return;
    }

    const started = await walkService.startWalk(intervalMs, contacts, () => setShowCheckIn(true));
    if (started) {
      setIsWalking(true);
      setTimeWalking(0);
      Alert.alert('Walk Started', `You'll be asked to check in every ${checkInInputValue} ${checkInUnit}. Stay safe!`);
    }
  };

  const handleEndWalk = () => {
    Alert.alert('End Walk?', 'Are you sure you want to end this walk session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Walk', onPress: () => { walkService.endWalk(true); setIsWalking(false); setTimeWalking(0); } },
    ]);
  };

  const handleCheckIn = (isSafe) => {
    setShowCheckIn(false);
    if (isSafe) {
      walkService.confirmSafe();
      Alert.alert('Check-in Recorded', 'Stay safe!');
    } else {
      walkService.triggerEmergency();
      setIsWalking(false);
      setTimeWalking(0);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <WalkSvg size={80} color={theme.colors.primary} />
        </View>

        <Text variant="headlineMedium" style={[styles.title, { color: textColor }]}>Walk with Me</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: subColor }]}>Dead-man's switch for safe walking</Text>

        {!isWalking ? (
          <>
            <Card style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content>
                <Text variant="titleMedium" style={[styles.label, { color: textColor, marginBottom: 8 }]}>Check-in Every...</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <TextInput
                    mode="outlined"
                    style={{ flex: 1, marginRight: 8, backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }}
                    textColor={textColor}
                    keyboardType="numeric"
                    value={checkInInputValue}
                    onChangeText={setCheckInInputValue}
                    placeholder="E.g., 5"
                  />
                  <SegmentedButtons 
                    value={checkInUnit} 
                    onValueChange={setCheckInUnit}
                    style={{ flex: 1.5 }}
                    buttons={[
                      { value: 'seconds', label: 'Secs' }, 
                      { value: 'minutes', label: 'Mins' }
                    ]}
                  />
                </View>

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1a2a3a' : '#E3F2FD' }]}>
                  <InfoSvg size={22} color={isDarkMode ? '#64B5F6' : '#1976D2'} />
                  <Text variant="bodySmall" style={[styles.infoText, { color: isDarkMode ? '#64B5F6' : '#1976D2' }]}>
                    You'll receive periodic check-ins. If you don't respond twice, emergency contacts will be alerted.
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Button mode="contained" onPress={handleStartWalk} style={styles.button} icon={() => <WalkSvg size={24} color="#fff" />}>
              Start Journey
            </Button>
          </>
        ) : (
          <>
            <Card style={[styles.card, styles.activeCard, { backgroundColor: cardBg }]}>
              <Card.Content>
                <View style={styles.timerContainer}>
                  <Text variant="displaySmall" style={styles.timer}>{formatTime(timeWalking)}</Text>
                  <Text variant="bodyLarge" style={{ color: subColor }}>duration</Text>
                </View>
                <View style={styles.statusContainer}>
                  <ShieldCheckSvg size={28} color="#4CAF50" />
                  <Text variant="titleMedium" style={styles.statusText}>Walk in Progress</Text>
                </View>
                <Text variant="bodyMedium" style={[styles.checkInInfo, { color: subColor }]}>
                  Next check-in in ~{checkInInputValue} {checkInUnit}
                </Text>
              </Card.Content>
            </Card>
            <Button mode="outlined" onPress={handleEndWalk} style={styles.button} textColor={theme.colors.error}>End Walk</Button>
          </>
        )}
      </ScrollView>

      {/* Check-in Modal */}
      <Modal visible={showCheckIn} transparent animationType="slide" onRequestClose={() => handleCheckIn(true)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
            <BellSvg size={64} color={theme.colors.primary} />
            <Text variant="headlineMedium" style={[styles.modalTitle, { color: textColor }]}>Safety Check-in</Text>
            <Text variant="bodyLarge" style={[styles.modalText, { color: subColor }]}>Are you safe?</Text>
            <View style={styles.modalButtons}>
              <Button mode="contained" onPress={() => handleCheckIn(true)} style={[styles.modalButton, { backgroundColor: '#4CAF50' }]} icon="check">I'm Safe</Button>
              <Button mode="contained" onPress={() => handleCheckIn(false)} style={[styles.modalButton, { backgroundColor: theme.colors.error }]} icon="alert">Need Help!</Button>
            </View>
            <Text variant="bodySmall" style={[styles.modalWarning, { color: subColor }]}>No response in 30 seconds will trigger an alert</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginVertical: 16 },
  title: { textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  card: { marginBottom: 24, borderRadius: 16, elevation: 2 },
  activeCard: { borderWidth: 2, borderColor: '#4CAF50' },
  label: { marginBottom: 12, fontWeight: '600' },
  labelSpacing: { marginTop: 24 },
  segmented: { marginBottom: 8 },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, borderRadius: 12 },
  infoText: { flex: 1, marginLeft: 10 },
  button: { marginTop: 16, borderRadius: 14, paddingVertical: 4 },
  timerContainer: { alignItems: 'center', marginBottom: 24 },
  timer: { fontWeight: 'bold', color: '#4CAF50' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statusText: { marginLeft: 8, color: '#4CAF50', fontWeight: '600' },
  checkInInfo: { textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 24, borderRadius: 20, alignItems: 'center' },
  modalTitle: { marginTop: 16, marginBottom: 8, fontWeight: '700' },
  modalText: { marginBottom: 24 },
  modalButtons: { width: '100%', gap: 12 },
  modalButton: { width: '100%' },
  modalWarning: { marginTop: 16, textAlign: 'center' },
});
