import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import { ShieldIcon } from './SvgIcons';
import { useDarkMode } from '../contexts/DarkModeContext';

const ACTIVITY_LOTTIE = {
  IDLE: require('../lottiefiles/idel.json'),
  WALKING: require('../lottiefiles/walking.json'),
  RUNNING: require('../lottiefiles/running2.json'),
};
const STANDING_PNG = require('../lottiefiles/standing.png');

function ActivityIcon({ activity, size = 44, color }) {
  const lottie = ACTIVITY_LOTTIE[activity];
  if (lottie) return <LottieView source={lottie} autoPlay loop style={{ width: size, height: size }} />;
  if (activity === 'STANDING') return <Image source={STANDING_PNG} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
  return null;
}

export default function ProtectionStatusCard({ isProtected, activity, confidence }) {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();

  const statusText = isProtected ? 'PROTECTED' : 'NOT ACTIVE';
  const statusColor = isProtected ? '#4CAF50' : (isDarkMode ? '#777' : '#BDBDBD');
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]}>
      <Card.Content style={styles.content}>
        <Animatable.View animation={isProtected ? 'pulse' : undefined} iterationCount="infinite" duration={2000}>
          <ShieldIcon size={48} active={isProtected} />
        </Animatable.View>

        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: isDarkMode ? '#999' : '#6b7280' }]}>ACTIVITY STATUS</Text>
          <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>

          {isProtected && (
            <View style={styles.activityRow}>
              <ActivityIcon activity={activity} size={44} color={theme.colors.primary} />
              <View style={styles.activityTextWrap}>
                <Text style={[styles.activityName, { color: isDarkMode ? '#fff' : '#1a1a2e' }]}>{activity}</Text>
                <Text style={[styles.confidenceText, { color: isDarkMode ? '#888' : '#999' }]}>
                  {isFinite(confidence) ? (confidence * 100).toFixed(0) : '0'}%
                </Text>
              </View>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  infoSection: { flex: 1, marginLeft: 14 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  status: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: 'rgba(21,145,234,0.08)', borderRadius: 12, padding: 6 },
  activityTextWrap: { marginLeft: 8 },
  activityName: { fontSize: 14, fontWeight: '700' },
  confidenceText: { fontSize: 11, marginTop: 1 },
});