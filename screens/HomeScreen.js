import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, Modal, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Button, useTheme, Text, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import { useDarkMode } from '../contexts/DarkModeContext';

import ProtectionStatusCard from '../components/ProtectionStatusCard';
import PanicButton from '../components/PanicButton';
import { sensorService } from '../services/sensorService';
import { locationService } from '../services/locationService';
import harModelService, { subscribeToActivity, getLatestActivity } from '../services/harModelService';
import { hapticPatterns } from '../services/hapticService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TILE_GAP = 12;
const TILE_WIDTH = (SCREEN_WIDTH - 28 - TILE_GAP) / 2; // wider tiles, less padding

const LOTTIE_SOURCES = {
  contacts: require('../lottiefiles/Phone icon animation.json'),
  safety: require('../lottiefiles/Shield Up.json'),
  community: require('../lottiefiles/community.json'),
  medical: require('../lottiefiles/HealthTap Spinner.json'),
};

const FEATURE_TILES = [
  { key: 'contacts', title: 'Contacts', subtitle: 'Emergency people', gradient: ['#FF6B6B', '#FF8E8E'], navigateTo: 'NewContacts' },
  { key: 'safety', title: 'Safety Mode', subtitle: 'Walk + Danger zones', gradient: ['#4ECDC4', '#6EDDD5'], navigateTo: 'NewSafetyMode' },
  { key: 'community', title: 'Community', subtitle: 'Nearby NYRA users', gradient: ['#FF9F43', '#FFB976'], navigateTo: 'NewCommunity' },
  { key: 'medical', title: 'Medical Info', subtitle: 'Health details', gradient: ['#EE5A82', '#F07DA0'], navigateTo: 'NewMedicalInfo' },
];

export default function HomeScreen({ onTabChange }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const protectionButtonRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  const [activityState, setActivityState] = useState(getLatestActivity());
  const { name: currentActivity, confidence, isProtectionActive: isMonitoring } = activityState;

  useEffect(() => { const u = subscribeToActivity(setActivityState); return () => u(); }, []);

  const onSwipeGesture = (e) => {
    if (e.nativeEvent.state === State.END && e.nativeEvent.translationX > 50 && e.nativeEvent.velocityX > 0) openSettings();
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };
  const closeSettings = () => {
    Animated.timing(slideAnim, { toValue: -Dimensions.get('window').width, duration: 300, useNativeDriver: true }).start(() => setIsSettingsOpen(false));
  };

  const handlePanicPress = () => navigation.navigate('Alert');

  const stopMonitoring = () => {
    harModelService.stop(); sensorService.stopSensorUpdates(); locationService.stopLocationUpdates();
    if (protectionButtonRef.current) protectionButtonRef.current.pulse(800);
  };

  const startMonitoring = async () => {
    try {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== 'granted') { Alert.alert('Permission Denied', 'Location access required.'); return; }
      await Location.requestBackgroundPermissionsAsync();
      await locationService.startLocationUpdates();
      await sensorService.startSensorUpdates();
      await harModelService.start();
      await hapticPatterns.monitoringActive();
      if (protectionButtonRef.current) protectionButtonRef.current.bounceIn(800);
    } catch (e) { Alert.alert('Error', 'Failed to start monitoring'); stopMonitoring(); }
  };

  const handleToggleProtection = () => isMonitoring ? stopMonitoring() : startMonitoring();

  const lastAnomalyRef = useRef(null);
  useEffect(() => {
    const a = activityState.anomaly;
    if (a && a.type === 'SUDDEN_STOP') {
      const k = `${a.type}_${Date.now()}`;
      if (lastAnomalyRef.current !== k) {
        lastAnomalyRef.current = k;
        harModelService.stop(); sensorService.stopSensorUpdates();
        try { navigation.navigate('Alert'); } catch (e) {}
      }
    }
  }, [activityState, navigation]);
  useEffect(() => { return () => stopMonitoring(); }, []);

  const handleTilePress = (tile) => navigation.navigate(tile.navigateTo);

  const renderFeatureTile = (tile, index) => {
    const bgColor = isDarkMode ? '#1e1e1e' : '#fff';
    const lottieSource = LOTTIE_SOURCES[tile.key];
    return (
      <Animatable.View key={tile.key} animation="fadeInUp" delay={200 + index * 80} duration={500}
        style={{ width: TILE_WIDTH, marginBottom: TILE_GAP }}
      >
        <TouchableOpacity
          style={[styles.featureTile, { backgroundColor: bgColor }]}
          onPress={() => handleTilePress(tile)}
          activeOpacity={0.7}
        >
          {/* Lottie on top */}
          <View style={styles.tileLottieWrap}>
            {lottieSource ? (
              <LottieView source={lottieSource} autoPlay loop style={styles.tileLottie} />
            ) : (
              <MaterialCommunityIcons name="help-circle" size={60} color={tile.gradient[0]} />
            )}
          </View>
          {/* Text below */}
          <Text style={[styles.tileTitle, { color: isDarkMode ? '#fff' : '#1a1a2e' }]}>{tile.title}</Text>
          <Text style={[styles.tileSubtitle, { color: isDarkMode ? '#888' : '#9ca3af' }]}>{tile.subtitle}</Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const menuItems = [
    { icon: 'account-circle-outline', label: 'Profile', onPress: () => { closeSettings(); navigation.navigate('Profile'); } },
    { icon: 'shield-lock-outline', label: 'Permissions', onPress: () => { closeSettings(); navigation.navigate('NewPermissions'); } },
    { icon: 'medical-bag', label: 'Medical Info', onPress: () => { closeSettings(); navigation.navigate('NewMedicalInfo'); } },
    { icon: 'cog-outline', label: 'Settings', onPress: () => { closeSettings(); navigation.navigate('NewSettings'); } },
    { icon: isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent', label: isDarkMode ? 'Light Mode' : 'Dark Mode', onPress: toggleDarkMode },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F0F4FF' }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerRow}>
            <IconButton icon="menu" size={30} onPress={openSettings} iconColor={isDarkMode ? '#fff' : theme.colors.primary} style={{ margin: 0 }} />
            <Text variant="titleLarge" style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#1a1a2e' }]}>NYRA</Text>
            <IconButton icon={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'} size={24} onPress={toggleDarkMode} iconColor={isDarkMode ? '#FFD700' : '#6b7280'} style={{ margin: 0 }} />
          </View>

          {/* Activity Status LEFT + Panic RIGHT */}
          <Animatable.View ref={protectionButtonRef} animation="fadeInUp" delay={100} style={styles.topRow}>
            <View style={styles.topLeft}>
              <ProtectionStatusCard isProtected={isMonitoring} activity={currentActivity} confidence={confidence} />
              <Button
                mode="contained"
                icon={isMonitoring ? 'shield-off' : 'shield-check'}
                onPress={handleToggleProtection}
                style={[styles.protectionBtn, { backgroundColor: isMonitoring ? theme.colors.error : theme.colors.primary }]}
                labelStyle={styles.protectionBtnLabel}
                compact
              >
                {isMonitoring ? 'Stop' : 'Start'}
              </Button>
            </View>
            <View style={styles.topRight}>
              <PanicButton onPress={handlePanicPress} />
            </View>
          </Animatable.View>

          {/* Quick Access — 4 bigger tiles */}
          <Text style={[styles.sectionLabel, { color: isDarkMode ? '#b0b0b0' : '#6b7280' }]}>QUICK ACCESS</Text>
          <View style={styles.tilesGrid}>
            {FEATURE_TILES.map((tile, i) => renderFeatureTile(tile, i))}
          </View>

        </ScrollView>

        <PanGestureHandler onHandlerStateChange={onSwipeGesture} activeOffsetX={10}>
          <View style={styles.swipeArea} />
        </PanGestureHandler>

        {/* Drawer */}
        <Modal visible={isSettingsOpen} transparent animationType="none" onRequestClose={closeSettings}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }], backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
              <View style={[styles.drawerHeader, { borderBottomColor: isDarkMode ? '#333' : '#e0e0e0' }]}>
                <Text variant="headlineSmall" style={{ fontWeight: '600', color: isDarkMode ? '#fff' : '#1a1a2e' }}>NYRA</Text>
                <IconButton icon="close" size={24} onPress={closeSettings} iconColor={isDarkMode ? '#fff' : '#000'} />
              </View>
              <ScrollView style={{ flex: 1 }}>
                {menuItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                      <IconButton icon={item.icon} size={24} iconColor={isDarkMode ? '#fff' : '#1a1a2e'} />
                      <Text style={{ fontSize: 16, marginLeft: 8, color: isDarkMode ? '#fff' : '#1a1a2e' }}>{item.label}</Text>
                    </TouchableOpacity>
                    {idx === 1 && <Divider style={{ marginHorizontal: 16, marginVertical: 4, backgroundColor: isDarkMode ? '#333' : '#e8e8e8' }} />}
                  </React.Fragment>
                ))}
              </ScrollView>
            </Animated.View>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSettings} />
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 8, paddingBottom: 24 },

  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  headerTitle: { flex: 1, fontWeight: '700', marginLeft: 4 },

  // Activity status LEFT + Panic RIGHT
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  topLeft: { flex: 1 },
  topRight: { alignItems: 'center', justifyContent: 'center' },
  protectionBtn: { borderRadius: 12, paddingVertical: 4, marginTop: 8, elevation: 3 },
  protectionBtnLabel: { fontSize: 13, fontWeight: '600' },

  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginTop: 6, marginBottom: 10, marginLeft: 6 },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 0 },

  featureTile: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLottieWrap: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tileLottie: { width: 90, height: 90 },
  tileTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  tileSubtitle: { fontSize: 13, lineHeight: 18, textAlign: 'center' },

  swipeArea: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 30, zIndex: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  drawerContainer: { width: Dimensions.get('window').width * 0.85, height: '100%', elevation: 16 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
});