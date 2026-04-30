import React, { useState, useCallback } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomNavigation } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AlertScreen from '../screens/AlertScreen';
import MedicalInfoScreen from '../screens/MedicalInfoScreen';
import WalkWithMeScreen from '../screens/WalkWithMeScreen';
import DangerZonesScreen from '../screens/DangerZonesScreen';
import SafetyModeScreen from '../screens/SafetyModeScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

// New feature screens
import NewContactsScreen from '../screens/NewContactsScreen';
import NewSafetyModeScreen from '../screens/NewSafetyModeScreen';
import NewCommunityScreen from '../screens/NewCommunityScreen';
import NewMedicalInfoScreen from '../screens/NewMedicalInfoScreen';
import NewSettingsScreen from '../screens/NewSettingsScreen';
import NewPermissionsScreen from '../screens/NewPermissionsScreen';

// --- Bottom Tab Navigator ---
const Tab = BottomNavigation;

const routes = [
  { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
  { key: 'contacts', title: 'Contacts', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
];

const TAB_KEY_TO_INDEX = { home: 0, contacts: 1 };

function TabNavigator() {
  const [index, setIndex] = useState(0);

  const handleTabChange = useCallback((tabKey) => {
    const tabIndex = TAB_KEY_TO_INDEX[tabKey];
    if (tabIndex !== undefined) setIndex(tabIndex);
  }, []);

  const renderScene = useCallback(({ route }) => {
    switch (route.key) {
      case 'home':
        return <HomeScreen onTabChange={handleTabChange} />;
      case 'contacts':
        return <ContactsScreen />;
      default:
        return null;
    }
  }, [handleTabChange]);

  const isHomeScreen = index === 0;

  return (
    <Tab
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      renderIcon={({ route, focused, color }) => {
        let iconName;
        switch (route.key) {
          case 'home': iconName = focused ? 'home' : 'home-outline'; break;
          case 'contacts': iconName = focused ? 'account-group' : 'account-group-outline'; break;
          default: iconName = 'help-circle-outline';
        }
        return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
      }}
      activeColor="#1591EA"
      inactiveColor="#A0A0A0"
      barStyle={{
        backgroundColor: "#FFFFFF",
        display: isHomeScreen ? 'none' : 'flex',
      }}
    />
  );
}

// --- Main Stack Navigator ---
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1591EA" },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Alert" component={AlertScreen} options={{ title: 'Emergency Alert', headerStyle: { backgroundColor: "#EF5350" }, headerBackVisible: false }} />
      <Stack.Screen name="MedicalInfo" component={MedicalInfoScreen} options={{ title: 'Medical Information' }} />
      <Stack.Screen name="WalkWithMe" component={WalkWithMeScreen} options={{ title: 'Walk with Me' }} />
      <Stack.Screen name="DangerZones" component={DangerZonesScreen} options={{ title: 'Danger Zones' }} />
      <Stack.Screen name="SafetyMode" component={SafetyModeScreen} options={{ title: 'Safety Mode' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'NYRA Community' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />

      {/* New feature screens */}
      <Stack.Screen name="NewContacts" component={NewContactsScreen} options={{ title: 'Emergency Contacts' }} />
      <Stack.Screen name="NewSafetyMode" component={NewSafetyModeScreen} options={{ title: 'Safety Mode' }} />
      <Stack.Screen name="NewCommunity" component={NewCommunityScreen} options={{ title: 'NYRA Community' }} />
      <Stack.Screen name="NewMedicalInfo" component={NewMedicalInfoScreen} options={{ title: 'Medical Information' }} />
      <Stack.Screen name="NewSettings" component={NewSettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="NewPermissions" component={NewPermissionsScreen} options={{ title: 'Permissions' }} />
    </Stack.Navigator>
  );
}