import { Alert } from 'react-native';
import { alertService } from './alertService';
import { locationService } from './locationService';

/**
 * Walk with Me Service
 * Dead-man's switch with periodic check-ins
 */

class WalkService {
    constructor() {
        this.walkTimer = null;
        this.checkInTimer = null;
        this.missedCheckIns = 0;
        this.isWalking = false;
        this.emergencyContacts = [];
        this.checkInCallback = null;
    }

    /**
     * Start a walk session
     * @param {number} checkInIntervalMs - Check-in interval in milliseconds
     * @param {Array} contacts - Emergency contacts
     * @param {Function} onCheckInRequired - Callback when check-in is needed
     */
    async startWalk(checkInIntervalMs, contacts, onCheckInRequired) {
        if (this.isWalking) {
            console.log('⚠️ Walk already in progress');
            return false;
        }

        this.emergencyContacts = contacts;
        this.checkInCallback = onCheckInRequired;
        this.missedCheckIns = 0;
        this.isWalking = true;

        console.log(`🚶 Starting walk: Open-ended duration, check-ins every ${checkInIntervalMs} ms`);

        // Schedule check-ins
        this.scheduleCheckIns(checkInIntervalMs);

        return true;
    }

    /**
     * Schedule periodic check-ins
     */
    scheduleCheckIns(checkInIntervalMs) {
        this.checkInTimer = setInterval(() => {
            console.log('⏰ Check-in time!');

            if (this.checkInCallback) {
                this.checkInCallback();
            }

            // Wait 30 seconds for response
            setTimeout(() => {
                this.missedCheckIns++;
                console.log(`⚠️ Missed check-in #${this.missedCheckIns}`);

                if (this.missedCheckIns >= 2) {
                    console.log('🚨 2 missed check-ins - triggering emergency!');
                    this.triggerEmergency();
                }
            }, 30000); // 30 seconds
        }, checkInIntervalMs);
    }

    /**
     * User confirmed they're safe
     */
    confirmSafe() {
        console.log('✅ User confirmed safe');
        this.missedCheckIns = 0;
    }

    /**
     * Trigger emergency alert
     */
    async triggerEmergency() {
        console.log('🚨 WALK EMERGENCY - No response to check-ins!');

        try {
            const location = await locationService.getCurrentLocation();
            
            // Use centralized alert service (calls + SMS)
            await alertService.triggerAlertProcedure();

            Alert.alert(
                '🚨 Emergency Alert Sent',
                'Emergency contacts have been notified via calls and SMS.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error sending walk emergency alert:', error);
        }

        this.endWalk(false);
    }

    /**
     * End walk session
     * @param {boolean} completed - Whether walk completed successfully
     */
    endWalk(completed = true) {
        if (this.walkTimer) {
            clearTimeout(this.walkTimer);
            this.walkTimer = null;
        }

        if (this.checkInTimer) {
            clearInterval(this.checkInTimer);
            this.checkInTimer = null;
        }

        this.isWalking = false;
        this.missedCheckIns = 0;
        this.checkInCallback = null;

        if (completed) {
            console.log('✅ Walk completed successfully');
            Alert.alert(
                '✅ Walk Completed',
                'You have arrived safely!',
                [{ text: 'OK' }]
            );
        } else {
            console.log('🛑 Walk ended (emergency)');
        }
    }

    /**
     * Get walk status
     */
    getStatus() {
        return {
            isWalking: this.isWalking,
            missedCheckIns: this.missedCheckIns,
        };
    }
}

export const walkService = new WalkService();
export default walkService;