import { NativeModules, Platform, Alert, NativeEventEmitter } from 'react-native';
import { audioRecordingService } from './audioRecordingService';

const { CallModule } = NativeModules;

// Log CallModule availability on module load
console.log('📞 CallModule Check:', {
  exists: !!CallModule,
  platform: Platform.OS,
  allModules: Object.keys(NativeModules).filter(k => k.includes('Call') || k.includes('Sms'))
});

// Create event emitter for call events
let callEventEmitter = null;
if (Platform.OS === 'android' && CallModule) {
  try {
    callEventEmitter = new NativeEventEmitter(CallModule);
    console.log('📞 CallModule event emitter initialized');
  } catch (error) {
    console.error('❌ Failed to initialize CallModule event emitter:', error);
  }
} else {
  console.warn('⚠️ CallModule not available - Platform:', Platform.OS, 'CallModule exists:', !!CallModule);
}

/**
 * Phone Call Service
 * Handles emergency phone calls to contacts using native Android module for direct calling
 */

// Callback for when emergency call ends
let onCallEndedCallback = null;
let callEndedSubscription = null;

/**
 * Set callback to be triggered when emergency call ends
 * Used to trigger SMS as backup protection
 * @param {Function} callback - Function to call when call ends
 */
const setCallEndedCallback = (callback) => {
  console.log('📞 Setting call ended callback');
  onCallEndedCallback = callback;
  
  // Remove existing subscription if any
  if (callEndedSubscription) {
    callEndedSubscription.remove();
    callEndedSubscription = null;
  }
  
  // Set up event listener for call ended
  if (callEventEmitter && callback) {
    console.log('📞 Subscribing to onEmergencyCallEnded event');
    callEndedSubscription = callEventEmitter.addListener('onEmergencyCallEnded', () => {
      console.log('📞 ✅ Emergency call ended - triggering callback for SMS');
      if (onCallEndedCallback) {
        try {
          onCallEndedCallback();
        } catch (error) {
          console.error('❌ Error in call ended callback:', error);
        }
      }
    });
  } else if (!callEventEmitter) {
    console.warn('⚠️ CallModule event emitter not available - SMS backup may not work');
  }
};

/**
 * Makes emergency calls to all contacts
 * @param {Array} contacts - Array of emergency contacts
 * @param {Object} location - Current location object
 * @param {Function} onCallEnded - Optional callback when call ends
 * @returns {Promise<Object>} Result of call attempts
 */
const makeEmergencyCalls = async (contacts, location, onCallEnded = null) => {
  // Set the callback if provided
  if (onCallEnded) {
    setCallEndedCallback(onCallEnded);
  }
  console.log('📞 Phone Call Service: Making emergency calls...');
  
  if (!contacts || contacts.length === 0) {
    console.warn('⚠️ Phone Call Service: No contacts provided');
    return { success: false, called: 0, message: 'No contacts available' };
  }

  // Use native module for direct calling if available (Android)
  if (Platform.OS === 'android' && CallModule) {
    try {
      const phoneNumbers = contacts.map(c => c.phone).filter(Boolean);
      
      // Get recorded emergency audio file path
      const audioFilePath = audioRecordingService.getLastRecordingUri();
      
      console.log('🔍 DEBUG: Checking for emergency audio...');
      console.log('🔍 DEBUG: audioFilePath =', audioFilePath);
      console.log('🔍 DEBUG: audioFilePath type:', typeof audioFilePath);
      
      if (audioFilePath) {
        console.log(`📞 Using native module to call ${phoneNumbers.length} contacts with audio message`);
        console.log(`🎙️ Audio file: ${audioFilePath}`);
      } else {
        console.log(`📞 Using native module to call ${phoneNumbers.length} contacts (no audio recorded)`);
        console.warn('⚠️ WARNING: No emergency audio message recorded! Recipient will not hear pre-recorded message.');
        console.warn('⚠️ TIP: Go to Settings → Emergency Voice Message → Record Message first!');
      }
      
      // Call using native module with audio file (automatically calls without dialer)
      const result = await CallModule.makeEmergencyCalls(phoneNumbers, audioFilePath);
      
      console.log('✅ Native call result:', result);
      
      return {
        success: result.called > 0,
        called: result.called,
        total: contacts.length,
        message: `Automatically called ${result.called} contact(s)`,
        nativeCall: true
      };
    } catch (error) {
      console.error('❌ Native call module error:', error);
      // Fall back to regular method
      Alert.alert('Call Error', 'Failed to use native calling. Falling back to dialer.');
    }
  }

  // Fallback to standard Linking API (opens dialer)
  console.log('⚠️ Using fallback dialer method');
  let callCount = 0;
  const callResults = [];

  for (const contact of contacts) {
    if (!contact.phone) {
      console.warn(`⚠️ Phone Call Service: Contact ${contact.name} has no phone number`);
      continue;
    }

    try {
      const phoneNumber = cleanPhoneNumber(contact.phone);
      const success = await makeCall(phoneNumber, contact.name);
      
      if (success) {
        callCount++;
        callResults.push({ contact: contact.name, success: true });
        console.log(`✅ Phone Call Service: Call dialer opened for ${contact.name}`);
        
        // Wait 5 seconds between calls
        if (callCount < contacts.length) {
          console.log('⏱️ Waiting 5 seconds before next call...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } else {
        callResults.push({ contact: contact.name, success: false });
        console.warn(`⚠️ Phone Call Service: Failed to open dialer for ${contact.name}`);
      }
    } catch (error) {
      console.error(`❌ Phone Call Service: Error calling ${contact.name}:`, error);
      callResults.push({ contact: contact.name, success: false, error: error.message });
    }
  }

  const result = {
    success: callCount > 0,
    called: callCount,
    total: contacts.length,
    results: callResults,
    message: `Opened dialer for ${callCount} out of ${contacts.length} contacts. Please tap CALL button to complete calls.`,
    nativeCall: false
  };

  console.log('📞 Phone Call Service: Call summary:', result);
  return result;
};

/**
 * Makes a single phone call
 * @param {string} phoneNumber - Phone number to call
 * @param {string} contactName - Name of the contact
 * @returns {Promise<boolean>} True if call was initiated
 */
const makeCall = async (phoneNumber, contactName) => {
  console.log(`📞 Phone Call Service: Initiating call to ${contactName} (${phoneNumber})...`);

  // Try native module first (Android only)
  if (Platform.OS === 'android' && CallModule) {
    try {
      // Get recorded emergency audio file path
      const audioFilePath = audioRecordingService.getLastRecordingUri();
      
      if (audioFilePath) {
        console.log('📞 Using native CallModule for direct call with audio message');
        console.log(`🎙️ Audio file: ${audioFilePath}`);
      } else {
        console.log('📞 Using native CallModule for direct call (no audio recorded)');
      }
      
      const result = await CallModule.makeEmergencyCall(phoneNumber, audioFilePath);
      
      if (result.success) {
        console.log(`✅ Phone Call Service: Direct call placed to ${contactName}`);
        Alert.alert(
          '📞 Emergency Call Placed',
          `Calling ${contactName} automatically...`,
          [{ text: 'OK' }]
        );
        return true;
      }
    } catch (error) {
      console.error('❌ Native call failed, falling back to Linking:', error);
    }
  }

  // Fallback to Linking API
  const { Linking } = require('react-native');
  const url = `tel:${phoneNumber}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    
    if (!canOpen) {
      console.error(`❌ Phone Call Service: Cannot open phone dialer for ${phoneNumber}`);
      Alert.alert(
        'Call Failed',
        `Unable to open phone dialer for ${contactName}. Please check if phone permissions are granted.`
      );
      return false;
    }

    await Linking.openURL(url);
    console.log(`✅ Phone Call Service: Dialer opened for ${contactName}`);
    console.log(`ℹ️ Note: Please tap the CALL button to complete the call`);
    
    Alert.alert(
      '📞 Emergency Call Ready',
      `Phone dialer opened for ${contactName}.\n\nTap the CALL button to complete the emergency call.`,
      [{ text: 'OK' }],
      { cancelable: false }
    );
    
    return true;
  } catch (error) {
    console.error(`❌ Phone Call Service: Error opening dialer for ${contactName}:`, error);
    Alert.alert(
      'Call Error',
      `Failed to open dialer for ${contactName}. Error: ${error.message}`
    );
    return false;
  }
};

/**
 * Cleans and formats phone number
 * @param {string} phone - Raw phone number
 * @returns {string} Cleaned phone number
 */
const cleanPhoneNumber = (phone) => {
  // Remove spaces, dashes, parentheses, and other non-numeric characters except '+'
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Checks if the device can make phone calls
 * @returns {Promise<boolean>} True if device supports phone calls
 */
const canMakeCall = async () => {
  try {
    // Check if native module is available (best option)
    if (Platform.OS === 'android' && CallModule) {
      console.log('📞 Phone Call Service: Native CallModule available - direct calling supported');
      return true;
    }
    
    // Fallback to Linking check
    const { Linking } = require('react-native');
    const url = 'tel:0000000000';
    const supported = await Linking.canOpenURL(url);
    console.log('📞 Phone Call Service: Device can make calls:', supported);
    return supported;
  } catch (error) {
    console.error('❌ Phone Call Service: Error checking call capability:', error);
    return false;
  }
};

/**
 * Cleanup function to remove event listeners
 */
const cleanup = () => {
  console.log('📞 Cleaning up phone call service');
  if (callEndedSubscription) {
    callEndedSubscription.remove();
    callEndedSubscription = null;
  }
  onCallEndedCallback = null;
};

export const phoneCallService = {
  makeEmergencyCalls,
  makeCall,
  canMakeCall,
  cleanPhoneNumber,
  setCallEndedCallback,
  cleanup,
};