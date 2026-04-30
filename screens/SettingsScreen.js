import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Text, List, Switch, Divider, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { useSettings } from '../hooks/useSettings';
import ErrorState from '../components/ErrorState';
import { phoneCallService } from '../services/phoneCallService';
import { audioRecordingService } from '../services/audioRecordingService';
import { permissionsService } from '../services/permissionsService';
import { createAudioPlayer } from 'expo-audio';

const sensitivityLabels = {
  0: 'Low',
  0.5: 'Medium',
  1: 'High',
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { settings, updateSetting, isLoading, error, retry, clearData } = useSettings();
  const [hasEmergencyAudio, setHasEmergencyAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [callPermissionStatus, setCallPermissionStatus] = useState(null);

  useEffect(() => {
    checkEmergencyAudio();
    checkCallPermissions();
    
    // Cleanup sound on unmount
    return () => {
      if (sound) {
        try {
          sound.remove();
        } catch {
          // Ignore cleanup errors during unmount.
        }
      }
    };
  }, []);

  const checkEmergencyAudio = async () => {
    const uri = await audioRecordingService.refreshLastRecordingUri();
    setHasEmergencyAudio(!!uri);
    setRecordingUri(uri);
  };

  const checkCallPermissions = async () => {
    const canCall = await phoneCallService.canMakeCall();
    setCallPermissionStatus({ canCall });
  };

  const handleRecordMessage = async () => {
    if (isRecording) {
      // Stop recording
      console.log('🛑 Stopping recording...');
      const result = await audioRecordingService.stopRecording();
      
      if (result.success) {
        Alert.alert(
          '✅ Saved', 
          `Emergency message recorded successfully!\n\nDuration: ${(result.duration / 1000).toFixed(1)}s\nFile size: ${(result.fileSize / 1024).toFixed(2)} KB\n\nYou can test it using the play button.`
        );
        setHasEmergencyAudio(true);
        setRecordingUri(result.uri);
      } else {
        Alert.alert('Error', `Failed to save recording: ${result.error || 'Unknown error'}`);
      }
      setIsRecording(false);
    } else {
      // Start recording
      console.log('🎙️ Starting recording...');
      const result = await audioRecordingService.startRecording(60000); // 60 seconds max
      
      if (result.success) {
        setIsRecording(true);
        
        Alert.alert(
          '🎙️ Recording Started',
          'Say something like:\n\n"This is [Your Name], I am in an emergency situation and need help immediately. Please check my location."\n\nPress "Stop Recording" when done (max 60 seconds).',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', `Failed to start recording: ${result.error || 'Unknown error'}`);
      }
    }
  };

  const handlePlayMessage = async () => {
    if (!recordingUri) {
      Alert.alert('Error', 'No recording available to play');
      return;
    }

    try {
      // Stop any existing sound
      if (sound) {
        try {
          sound.pause();
          await sound.seekTo(0);
        } catch (e) {
          console.warn('Error stopping previous audio:', e);
        }
      }

      console.log('🔊 Playing recording:', recordingUri);
      
      const newSound = createAudioPlayer(recordingUri);
      
      setSound(newSound);
      newSound.play();
      
      // Auto-cleanup when finished - listen for end event
      setTimeout(async () => {
        if (newSound) {
          try {
            newSound.remove();
          } catch (e) {
            console.warn('Error removing audio:', e);
          }
          setSound(null);
        }
      }, 60000); // Max 60 seconds
    } catch (error) {
      console.error('❌ Error playing recording:', error);
      Alert.alert('Error', `Failed to play the recording: ${error.message}`);
    }
  };

  const handleDeleteMessage = async () => {
    Alert.alert(
      'Delete Emergency Message?',
      'Are you sure you want to delete your recorded emergency message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (recordingUri) {
              const deleted = await audioRecordingService.deleteRecording(recordingUri);
              if (deleted) {
                setHasEmergencyAudio(false);
                setRecordingUri(null);
                Alert.alert('Deleted', 'Emergency message has been deleted');
              } else {
                Alert.alert('Error', 'Failed to delete the recording');
              }
            }
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "🗑️ Clear All Data?",
      "This will permanently delete all contacts and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data", style: "destructive", onPress: async () => {
            try {
              await clearData();
              Alert.alert("✅ Success", "All app data has been cleared.");
            } catch (e) {
              console.error("Failed to clear data:", e);
              Alert.alert("❌ Error", "Could not clear all data. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleExportLogs = () => {
    console.log('Export Logs Pressed');
    Alert.alert("Coming Soon", "This feature is not yet available.");
  };

  const getSensitivityLabel = (value) => {
    if (value < 0.25) return 'Low';
    if (value > 0.75) return 'High';
    return 'Medium';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={{ marginTop: 10 }}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader>Detection Settings ⚙️</List.Subheader>
          <List.Item
            title="Enable Automatic Detection"
            description="Monitor activity for falls in the background"
            left={props => <List.Icon {...props} icon="walk" />}
            right={props => <Switch value={settings.isAutoDetectionEnabled} onValueChange={(value) => updateSetting('isAutoDetectionEnabled', value)} />}
          />
          <View style={styles.sliderContainer}>
            <List.Item
              title="Detection Sensitivity"
              description={`Current: ${getSensitivityLabel(settings.detectionSensitivity)}`}
              left={props => <List.Icon {...props} icon="tune-variant" />}
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.5}
              value={settings.detectionSensitivity}
              onSlidingComplete={(value) => updateSetting('detectionSensitivity', value)}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.onSurfaceDisabled}
              thumbTintColor={Platform.OS === 'android' ? theme.colors.primary : undefined}
            />
            <View style={styles.sliderLabels}>
              <Text>Low</Text>
              <Text>Medium</Text>
              <Text>High</Text>
            </View>
          </View>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Alert Preferences 📣</List.Subheader>
          <List.Item
            title="Make Emergency Calls"
            description={
              callPermissionStatus === null 
                ? "Checking permissions..." 
                : callPermissionStatus.canCall 
                  ? "Automatically call emergency contacts" 
                  : "❌ Permission required"
            }
            left={props => <List.Icon {...props} icon="phone-alert" />}
            right={props => <Switch value={settings.makeEmergencyCalls} onValueChange={(value) => updateSetting('makeEmergencyCalls', value)} />}
          />
          {callPermissionStatus && !callPermissionStatus.canCall && (
            <List.Item
              title="⚠️ Grant Phone Permissions"
              description="Required for automatic emergency calls"
              left={props => <List.Icon {...props} icon="shield-alert" color="orange" />}
              onPress={async () => {
                const granted = await permissionsService.ensurePhonePermission();
                if (granted) {
                  checkCallPermissions();
                  Alert.alert('Success', 'Phone permissions granted!');
                }
              }}
            />
          )}
          <List.Item
            title="Send SMS Alerts"
            left={props => <List.Icon {...props} icon="message-alert-outline" />}
            right={props => <Switch value={settings.sendSmsAlerts} onValueChange={(value) => updateSetting('sendSmsAlerts', value)} />}
          />
          <List.Item
            title="Record Audio on Alert"
            description="Automatically record audio when emergency is triggered"
            left={props => <List.Icon {...props} icon="record-rec" />}
            right={props => <Switch value={settings.recordAudioOnAlert} onValueChange={(value) => updateSetting('recordAudioOnAlert', value)} />}
          />
          <List.Item
            title="Share Live Location"
            description="Include GPS coordinates in alerts"
            left={props => <List.Icon {...props} icon="map-marker-radius-outline" />}
            right={props => <Switch value={settings.shareLiveLocation} onValueChange={(value) => updateSetting('shareLiveLocation', value)} />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Emergency Voice Message 🎙️</List.Subheader>
          <List.Item
            title={hasEmergencyAudio ? "Emergency Message Recorded" : "No Emergency Message"}
            description={hasEmergencyAudio ? "Tap to play or re-record your message" : "Record a message to play during emergency calls"}
            left={props => <List.Icon {...props} icon={hasEmergencyAudio ? "check-circle" : "alert-circle-outline"} color={hasEmergencyAudio ? 'green' : 'grey'} />}
          />
          <View style={styles.audioControls}>
            <Button
              mode={isRecording ? "contained" : "outlined"}
              icon={isRecording ? "stop" : "microphone"}
              onPress={handleRecordMessage}
              style={{ flex: 1, marginRight: 8 }}
              buttonColor={isRecording ? theme.colors.error : undefined}
            >
              {isRecording ? 'Stop Recording' : 'Record Message'}
            </Button>
            {hasEmergencyAudio && !isRecording && (
              <>
                <IconButton
                  icon="play"
                  mode="contained-tonal"
                  onPress={handlePlayMessage}
                  size={24}
                />
                <IconButton
                  icon="delete"
                  mode="contained-tonal"
                  iconColor={theme.colors.error}
                  onPress={handleDeleteMessage}
                  size={24}
                />
              </>
            )}
          </View>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>App Permissions 🔐</List.Subheader>
          <List.Item
            title="Request All Permissions"
            description="Grant phone, SMS, and audio permissions"
            left={props => <List.Icon {...props} icon="shield-check" />}
            right={() => (
              <Button mode="contained-tonal" onPress={async () => {
                const results = await permissionsService.requestAllPermissions();
                const granted = Object.values(results).filter(v => v).length;
                Alert.alert('Permissions', `${granted} out of 3 permissions granted`);
                checkCallPermissions();
              }}>
                Grant
              </Button>
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Medical Information 🏥</List.Subheader>
          <List.Item
            title="Emergency Medical Info"
            description="Add blood type, allergies, medications"
            left={props => <List.Icon {...props} icon="medical-bag" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('MedicalInfo')}
          />
        </List.Section>

        <Divider />

        <View style={styles.buttonContainer}>
          <Button
            icon="delete-sweep-outline"
            mode="elevated"
            onPress={handleClearData}
            style={styles.button}
            textColor={theme.colors.error}
          >
            Clear All App Data
          </Button>
          <Button
            icon="file-export-outline"
            mode="outlined"
            onPress={handleExportLogs}
            style={styles.button}
          >
            Export Activity Logs
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  }
});
