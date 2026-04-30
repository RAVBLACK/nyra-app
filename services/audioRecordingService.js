import {
  AudioModule,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { saveEmergencyAudioPath, clearEmergencyAudioPath, loadEmergencyAudioPath } from './storageService';

let recording = null;
let recordingUri = null;
let recordingStartedAt = null;

const recordingFileExists = async (uri) => {
  if (!uri) return false;

  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return !!fileInfo.exists;
  } catch (error) {
    console.warn('Audio Recording Service: Could not check recording file:', error);
    return false;
  }
};

const loadSavedAudioPromise = (async () => {
  try {
    const savedUri = await loadEmergencyAudioPath();
    if (savedUri && await recordingFileExists(savedUri)) {
      recordingUri = savedUri;
      console.log('Audio Recording Service: Loaded saved audio path:', savedUri);
    } else if (savedUri) {
      await clearEmergencyAudioPath();
    }
  } catch (error) {
    console.warn('Audio Recording Service: Could not load saved audio path:', error);
  }
})();

const requestPermissions = async () => {
  console.log('Audio Recording Service: Requesting permissions...');

  try {
    const { granted } = await requestRecordingPermissionsAsync();
    console.log(`Audio Recording Service: Permissions ${granted ? 'granted' : 'denied'}`);
    return granted;
  } catch (error) {
    console.error('Audio Recording Service: Error requesting permissions:', error);
    return false;
  }
};

const checkPermissions = async () => {
  console.log('Audio Recording Service: Checking permissions...');

  try {
    const { granted } = await getRecordingPermissionsAsync();
    console.log(`Audio Recording Service: Permission status: ${granted ? 'granted' : 'denied'}`);
    return granted;
  } catch (error) {
    console.error('Audio Recording Service: Error checking permissions:', error);
    return false;
  }
};

const ensurePermissions = async () => {
  const hasPermission = await checkPermissions();
  return hasPermission || await requestPermissions();
};

const startRecording = async (maxDuration = 300000) => {
  console.log('Audio Recording Service: Starting recording...');

  try {
    const hasPermission = await ensurePermissions();
    if (!hasPermission) {
      return { success: false, error: 'Recording permission denied' };
    }

    if (recording) {
      await stopRecording();
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });

    recording = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await recording.prepareToRecordAsync();
    recording.record();
    recordingStartedAt = Date.now();

    if (maxDuration > 0) {
      setTimeout(async () => {
        if (recording) {
          console.log('Audio Recording Service: Max duration reached, stopping recording');
          await stopRecording();
        }
      }, maxDuration);
    }

    return {
      success: true,
      recording,
      message: 'Recording started',
    };
  } catch (error) {
    console.error('Audio Recording Service: Error starting recording:', error);
    recording = null;
    recordingStartedAt = null;
    return {
      success: false,
      error: error.message,
    };
  }
};

const stopRecording = async () => {
  console.log('Audio Recording Service: Stopping recording...');

  if (!recording) {
    return { success: false, error: 'No active recording' };
  }

  try {
    await recording.stop();

    const uri = recording.uri;
    const duration = recordingStartedAt ? Date.now() - recordingStartedAt : 0;
    let fileSize = 0;

    if (uri) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      fileSize = fileInfo.size || 0;
      recordingUri = uri;
      await saveEmergencyAudioPath(uri);
    }

    recording = null;
    recordingStartedAt = null;

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    return {
      success: !!uri,
      uri,
      fileSize,
      duration,
      message: uri ? 'Recording stopped successfully' : 'Recording stopped but no file URI was returned',
    };
  } catch (error) {
    console.error('Audio Recording Service: Error stopping recording:', error);
    recording = null;
    recordingStartedAt = null;
    return {
      success: false,
      error: error.message,
    };
  }
};

const getRecordingStatus = async () => {
  if (!recording) {
    return {
      isRecording: false,
      duration: 0,
    };
  }

  try {
    const status = recording.getStatus ? recording.getStatus() : null;
    return {
      isRecording: status?.isRecording ?? true,
      duration: status?.durationMillis ?? (recordingStartedAt ? Date.now() - recordingStartedAt : 0),
      canRecord: status?.canRecord ?? true,
    };
  } catch (error) {
    console.error('Audio Recording Service: Error getting recording status:', error);
    return {
      isRecording: false,
      duration: 0,
      error: error.message,
    };
  }
};

const getLastRecordingUri = () => recordingUri;

const refreshLastRecordingUri = async () => {
  await loadSavedAudioPromise;
  return recordingUri;
};

const deleteRecording = async (uri) => {
  console.log('Audio Recording Service: Deleting recording:', uri);

  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists) {
      return false;
    }

    await FileSystem.deleteAsync(uri);

    if (recordingUri === uri) {
      recordingUri = null;
      await clearEmergencyAudioPath();
    }

    return true;
  } catch (error) {
    console.error('Audio Recording Service: Error deleting recording:', error);
    return false;
  }
};

export const audioRecordingService = {
  requestPermissions,
  checkPermissions,
  ensurePermissions,
  startRecording,
  stopRecording,
  getRecordingStatus,
  getLastRecordingUri,
  refreshLastRecordingUri,
  deleteRecording,
};
