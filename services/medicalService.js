import AsyncStorage from '@react-native-async-storage/async-storage';
// import notifee, { AndroidImportance } from '@notifee/react-native'; // Requires native build

/**
 * Medical Service
 * Manages medical information and persistent notification
 */

const MEDICAL_INFO_KEY = '@nyra_medical_info';

class MedicalService {
    /**
     * Save medical information
     * @param {Object} medicalInfo - Medical data
     * @param {string} medicalInfo.bloodType - Blood type (A+, B+, O+, etc.)
     * @param {string} medicalInfo.allergies - Allergies
     * @param {string} medicalInfo.medications - Current medications
     * @param {string} medicalInfo.conditions - Medical conditions
     * @param {string} medicalInfo.emergencyNotes - Additional notes
     */
    async saveMedicalInfo(medicalInfo) {
        try {
            await AsyncStorage.setItem(MEDICAL_INFO_KEY, JSON.stringify(medicalInfo));
            console.log('✅ Medical info saved');
            return true;
        } catch (error) {
            console.error('Error saving medical info:', error);
            return false;
        }
    }

    /**
     * Load medical information
     * @returns {Promise<Object|null>}
     */
    async loadMedicalInfo() {
        try {
            const data = await AsyncStorage.getItem(MEDICAL_INFO_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading medical info:', error);
            return null;
        }
    }

    /**
   * Show persistent medical ID notification
   * @param {Object} medicalInfo - Medical data to display
   * NOTE: Requires native build with Notifee. Disabled for Expo Go.
   */
    async showMedicalNotification(medicalInfo) {
        console.log('⚠️ Persistent notifications require native build (Notifee)');
        console.log('Medical info saved locally. Will show notification after native build.');
        return false;

        /* Uncomment after native build:
        try {
          const channelId = await notifee.createChannel({
            id: 'medical-id',
            name: 'Medical ID',
            importance: AndroidImportance.HIGH,
          });
    
          const body = [
            medicalInfo.bloodType ? `🩸 Blood: ${medicalInfo.bloodType}` : null,
            medicalInfo.allergies ? `⚠️ Allergies: ${medicalInfo.allergies}` : null,
            medicalInfo.medications ? `💊 Meds: ${medicalInfo.medications}` : null,
            medicalInfo.conditions ? `🏥 Conditions: ${medicalInfo.conditions}` : null,
          ].filter(Boolean).join('\n');
    
          await notifee.displayNotification({
            id: 'medical-id-notification',
            title: '🏥 Emergency Medical Information',
            body: body || 'Tap to view emergency contacts',
            android: {
              channelId,
              ongoing: true,
              pressAction: { id: 'default' },
              actions: [{ title: '📞 View Contacts', pressAction: { id: 'view-contacts' } }],
              visibility: 1,
              showTimestamp: false,
              autoCancel: false,
            },
          });
    
          console.log('✅ Medical ID notification displayed');
          return true;
        } catch (error) {
          console.error('Error showing medical notification:', error);
          return false;
        }
        */
    }

    /**
     * Hide medical ID notification
     * NOTE: Requires native build with Notifee. Disabled for Expo Go.
     */
    async hideMedicalNotification() {
        console.log('⚠️ Notification hiding requires native build');
        return false;

        /* Uncomment after native build:
        try {
          await notifee.cancelNotification('medical-id-notification');
          console.log('✅ Medical ID notification hidden');
          return true;
        } catch (error) {
          console.error('Error hiding medical notification:', error);
          return false;
        }
        */
    }

    /**
     * Check if medical info exists
     * @returns {Promise<boolean>}
     */
    async hasMedicalInfo() {
        const info = await this.loadMedicalInfo();
        return info !== null && Object.keys(info).length > 0;
    }

    /**
     * Delete medical information
     */
    async deleteMedicalInfo() {
        try {
            await AsyncStorage.removeItem(MEDICAL_INFO_KEY);
            await this.hideMedicalNotification();
            console.log('✅ Medical info deleted');
            return true;
        } catch (error) {
            console.error('Error deleting medical info:', error);
            return false;
        }
    }
}

export const medicalService = new MedicalService();
export default medicalService;
