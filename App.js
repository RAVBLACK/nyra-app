import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './utils/theme'; // Import your custom theme
import AppNavigator from './navigation/AppNavigator'; // Import the navigator
import { StatusBar } from 'expo-status-bar';
import { permissionsService } from './services/permissionsService';
import { DarkModeProvider } from './contexts/DarkModeContext';

export default function App() {
  useEffect(() => {
    // Request critical permissions on app startup
    const requestInitialPermissions = async () => {
      console.log('📱 App startup: Requesting initial permissions...');
      try {
        await permissionsService.requestAllPermissions();
        console.log('✅ Initial permissions requested');
      } catch (error) {
        console.error('❌ Error requesting initial permissions:', error);
      }
    };

    requestInitialPermissions();
  }, []);

  return (
    <DarkModeProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </DarkModeProvider>
  );
}