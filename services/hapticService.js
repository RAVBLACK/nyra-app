import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Service
 * Provides tactile feedback patterns for different app states
 */

export const hapticPatterns = {
    /**
     * One long vibration - Monitoring started/stopped
     */
    monitoringActive: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    /**
     * Three short pulses - Alert sent successfully
     */
    alertSent: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /**
     * Error pattern - Something went wrong
     */
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    /**
     * Success pattern - Action completed successfully
     */
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    /**
     * Warning pattern - Entering danger zone, low battery, etc.
     */
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    /**
     * Light tap - Button press feedback
     */
    lightTap: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /**
     * Medium tap - Important button press
     */
    mediumTap: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
};

export default hapticPatterns;
