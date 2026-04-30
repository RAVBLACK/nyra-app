import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

const openSettingsAction = {
    text: 'Open Settings',
    onPress: () => Linking.openSettings(),
};

const checkSMSPermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    } catch (error) {
        console.error('Permissions Service: Error checking SMS permission:', error);
        return false;
    }
};

const requestSMSPermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
            {
                title: 'SMS Permission Required',
                message: 'NYRA needs permission to send emergency SMS alerts to your emergency contacts.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Deny',
                buttonPositive: 'Allow',
            }
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        if (!isGranted) {
            Alert.alert(
                'Permission Denied',
                'SMS permission is required to send automatic emergency alerts. You can enable it in Settings.',
                [{ text: 'Cancel', style: 'cancel' }, openSettingsAction]
            );
        }

        return isGranted;
    } catch (error) {
        console.error('Permissions Service: Error requesting SMS permission:', error);
        Alert.alert('Permission Error', 'Failed to request SMS permission. Please try again.');
        return false;
    }
};

const ensureSMSPermission = async () => {
    const hasPermission = await checkSMSPermission();
    return hasPermission || await requestSMSPermission();
};

const checkPhonePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
        const callGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
        const phoneStateGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
        return callGranted && phoneStateGranted;
    } catch (error) {
        console.error('Permissions Service: Error checking phone permissions:', error);
        return false;
    }
};

const requestPhonePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
        const results = await PermissionsAndroid.requestMultiple(
            [
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            ],
            {
                title: 'Phone Permission Required',
                message: 'NYRA needs permission to make emergency calls and detect when calls end so backup SMS can be sent.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Deny',
                buttonPositive: 'Allow',
            }
        );

        const isGranted =
            results[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === PermissionsAndroid.RESULTS.GRANTED &&
            results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;

        if (!isGranted) {
            Alert.alert(
                'Permission Denied',
                'Phone and call-state permissions are required for automatic calls and backup SMS. You can enable them in Settings.',
                [{ text: 'Cancel', style: 'cancel' }, openSettingsAction]
            );
        }

        return isGranted;
    } catch (error) {
        console.error('Permissions Service: Error requesting phone permissions:', error);
        Alert.alert('Permission Error', 'Failed to request phone permissions. Please try again.');
        return false;
    }
};

const ensurePhonePermission = async () => {
    const hasPermission = await checkPhonePermission();
    return hasPermission || await requestPhonePermission();
};

const checkAudioPermission = async () => {
    try {
        const { granted } = await getRecordingPermissionsAsync();
        return granted;
    } catch (error) {
        console.error('Permissions Service: Error checking audio recording permission:', error);
        return false;
    }
};

const requestAudioPermission = async () => {
    try {
        const { granted } = await requestRecordingPermissionsAsync();

        if (!granted) {
            Alert.alert(
                'Permission Denied',
                'Audio recording permission is required to record audio during emergencies. You can enable it in Settings.',
                [{ text: 'Cancel', style: 'cancel' }, openSettingsAction]
            );
        }

        return granted;
    } catch (error) {
        console.error('Permissions Service: Error requesting audio recording permission:', error);
        Alert.alert('Permission Error', 'Failed to request audio recording permission. Please try again.');
        return false;
    }
};

const ensureAudioPermission = async () => {
    const hasPermission = await checkAudioPermission();
    return hasPermission || await requestAudioPermission();
};

const requestAllPermissions = async () => {
    const results = {
        sms: await ensureSMSPermission(),
        phone: await ensurePhonePermission(),
        audio: await ensureAudioPermission(),
    };

    if (!results.sms || !results.phone || !results.audio) {
        const missing = [];
        if (!results.sms) missing.push('SMS');
        if (!results.phone) missing.push('Phone Calls');
        if (!results.audio) missing.push('Audio Recording');

        Alert.alert(
            'Permissions Required',
            `The following permissions are needed for NYRA to function properly: ${missing.join(', ')}.`,
            [{ text: 'OK' }, openSettingsAction]
        );
    }

    return results;
};

export const permissionsService = {
    checkSMSPermission,
    requestSMSPermission,
    ensureSMSPermission,
    checkSmsPermission: checkSMSPermission,
    requestSmsPermission: requestSMSPermission,
    ensureSmsPermission: ensureSMSPermission,
    checkPhonePermission,
    requestPhonePermission,
    ensurePhonePermission,
    checkAudioPermission,
    requestAudioPermission,
    ensureAudioPermission,
    requestAllPermissions,
};
