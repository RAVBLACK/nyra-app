import { loadContacts, loadSettings } from './storageService';
import { locationService } from './locationService';
import { smsService } from './smsService';
import { phoneCallService } from './phoneCallService';
import { permissionsService } from './permissionsService';
import { audioRecordingService } from './audioRecordingService';

/**
 * Coordinates the entire alert procedure based on user settings.
 * Tries phone calls first, falls back to SMS if calls fail or are disabled.
 * Optionally starts audio recording during emergencies.
 */
const triggerAlertProcedure = async () => {
  console.log('--- Triggering Alert Procedure ---');

  // 1. Load contacts and settings
  const contacts = await loadContacts();
  const settings = await loadSettings();

  if (!contacts || contacts.length === 0) {
    console.warn('Alert procedure aborted: No emergency contacts found.');
    return;
  }

  // 2. Get last known location
  const location = locationService.getLastKnownLocation();
  if (!location) {
      console.warn("Could not get last known location for the alert.");
  }

  let callsSuccessful = false;

  // 3. Start audio recording if enabled in settings
  if (settings.recordAudioOnAlert) {
    console.log('🎤 Starting emergency audio recording...');
    try {
      const hasAudioPermission = await permissionsService.ensureAudioPermission();
      if (hasAudioPermission) {
        const recordingResult = await audioRecordingService.startRecording(300000); // 5 minutes max
        if (recordingResult.success) {
          console.log('✅ Audio recording started successfully');
        } else {
          console.warn('⚠️ Failed to start audio recording:', recordingResult.error);
        }
      } else {
        console.warn('⚠️ Audio recording permission not granted');
      }
    } catch (error) {
      console.error('❌ Error starting audio recording:', error);
    }
  }

  // 4. Make emergency calls first (if enabled)
  if (settings.makeEmergencyCalls) {
    console.log('📞 Attempting to make emergency calls...');
    try {
      // Ensure phone call permission is granted
      const hasPhonePermission = await permissionsService.ensurePhonePermission();
      
      if (!hasPhonePermission) {
        console.warn('⚠️ Phone call permission not granted, skipping calls');
      } else {
        // Define callback to send SMS when call ends (DUAL PROTECTION LAYER)
        const onCallEnded = async () => {
          console.log('🔔 CALLBACK TRIGGERED: Call ended, activating SMS backup layer');
          if (settings.sendSmsAlerts) {
            console.log('📱 🔐 DUAL PROTECTION: Sending automatic SMS after call ended');
            try {
              // Ensure SMS permission is granted
              const hasSmsPermission = await permissionsService.ensureSmsPermission();
              if (!hasSmsPermission) {
                console.error('❌ SMS permission not granted, cannot send backup SMS');
                return;
              }
              
              // Send SMS to all emergency contacts (AUTOMATIC - NO COMPOSER, SILENT MODE)
              console.log('📱 Sending automatic SMS to all emergency contacts (silent mode)...');
              const smsResult = await smsService.sendEmergencySMS(contacts, location, null, true);
              if (smsResult && smsResult.success) {
                console.log('✅ 🔐 DUAL PROTECTION SMS sent successfully after call ended');
              } else {
                console.error('❌ Failed to send backup SMS after call');
              }
            } catch (error) {
              console.error('❌ Error sending backup SMS after call:', error);
            }
          } else {
            console.log('📱 SMS alerts disabled in settings, skipping backup SMS');
          }
        };
        
        // Set the callback BEFORE making calls (CRITICAL for dual protection)
        console.log('📞 🔐 Setting up dual protection: Calls + SMS after call ends');
        phoneCallService.setCallEndedCallback(onCallEnded);
        
        // Make emergency calls
        console.log('📞 Making emergency calls...');
        const callResult = await phoneCallService.makeEmergencyCalls(contacts, location, onCallEnded);
        callsSuccessful = callResult && callResult.success && callResult.called > 0;
        
        if (callsSuccessful && callResult.nativeCall) {
          console.log(`✅ Emergency calls succeeded: ${callResult.called} contact(s) called`);
          console.log('📱 🔐 SMS will be automatically sent when call ends (DUAL PROTECTION)');
          // SMS will be automatically sent when call ends via callback
          return; // Exit early since SMS is handled by callback
        } else if (callsSuccessful) {
          console.log('Emergency call opened with fallback dialer. Sending SMS immediately because call-ended events are unavailable.');
          callsSuccessful = false;
        } else {
          console.warn('⚠️ Emergency calls failed or no calls were made');
        }
      }
    } catch (error) {
      console.error('❌ Error making emergency calls:', error);
      callsSuccessful = false;
    }
  } else {
    console.log('Emergency calls are disabled in settings.');
  }

  // 5. Send SMS alerts as backup OR if calls are disabled
  // SMS is sent if:
  // - SMS is enabled in settings AND
  // - (Calls failed OR calls are disabled)
  const shouldSendSms = settings.sendSmsAlerts && (!settings.makeEmergencyCalls || !callsSuccessful);
  
  if (settings.sendSmsAlerts) {
    if (shouldSendSms) {
      console.log('📱 Attempting to send SMS alerts...');
      try {
        await smsService.sendEmergencySMS(contacts, location);
        console.log('✅ SMS alerts sent successfully');
      } catch (error) {
        console.error('❌ Error sending SMS alerts:', error);
      }
    } else if (callsSuccessful) {
      console.log('📱 SMS alerts skipped - emergency calls were successful');
    }
  } else {
    console.log('SMS alerts are disabled in settings.');
  }
  
  console.log('--- Alert Procedure Finished ---');
};

export const alertService = {
  triggerAlertProcedure,
};
