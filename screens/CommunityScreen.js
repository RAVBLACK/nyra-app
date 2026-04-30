import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, TextInput as RNTextInput, Linking } from 'react-native';
import { Card, Button, Text, useTheme, Avatar, Chip, IconButton, Switch, Dialog, Portal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { useDarkMode } from '../contexts/DarkModeContext';
import {
    startLocationSharing,
    stopLocationSharing,
    getNearbyUsers,
    sendSOSToNearby,
    getSharingStatus,
    subscribeToNearbyUsers,
    unsubscribeFromNearbyUsers,
    sendAlertToUser,
} from '../services/communityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CommunityScreen() {
    const theme = useTheme();
    const { isDarkMode } = useDarkMode();
    const [isSharing, setIsSharing] = useState(false);
    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [maxDistance, setMaxDistance] = useState(1000); // Default 1km
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [userName, setUserName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        const loadUserProfile = async () => {
            const savedName = await AsyncStorage.getItem('nyra_userName');
            const savedPhone = await AsyncStorage.getItem('nyra_phoneNumber');
            if (savedName) setUserName(savedName);
            if (savedPhone) setPhoneNumber(savedPhone);

            // Show profile dialog if not set
            if (!savedName || !savedPhone) {
                setShowProfileDialog(true);
            }
        };

        loadUserProfile();

        const status = getSharingStatus();
        setIsSharing(status.isSharing);

        // Set up real-time updates when sharing is enabled
        if (status.isSharing) {
            subscribeToNearbyUsers(maxDistance, (users) => {
                setNearbyUsers(users);
                console.log(`🔄 Real-time update: ${users.length} nearby users`);
            });
        }

        return () => {
            unsubscribeFromNearbyUsers();
        };
    }, [maxDistance]);

    const handleToggleSharing = async () => {
        if (!userName || !phoneNumber) {
            setShowProfileDialog(true);
            Alert.alert('Profile Required', 'Please set up your name and phone number first.');
            return;
        }

        if (isSharing) {
            unsubscribeFromNearbyUsers();
            const result = await stopLocationSharing();
            if (result.success) {
                setIsSharing(false);
                setNearbyUsers([]);
                Alert.alert('Location Sharing Stopped', 'You are no longer visible to nearby NYRA users.');
            }
        } else {
            const result = await startLocationSharing(userName, phoneNumber);
            if (result.success) {
                setIsSharing(true);
                Alert.alert('Location Sharing Started', 'You are now visible to nearby NYRA users within your selected range.');

                // Subscribe to real-time updates
                subscribeToNearbyUsers(maxDistance, (users) => {
                    setNearbyUsers(users);
                });

                await loadNearbyUsers();
            } else {
                Alert.alert('Error', result.error || 'Could not start location sharing');
            }
        }
    };

    const loadNearbyUsers = async () => {
        setIsLoading(true);
        const result = await getNearbyUsers(maxDistance);
        if (result.success) {
            setNearbyUsers(result.users);
        } else {
            Alert.alert('Error', result.error || 'Could not load nearby users');
        }
        setIsLoading(false);
    };

    const handleSendSOS = () => {
        const usersWithPhones = nearbyUsers.filter(u => u.phoneNumber).length;
        
        Alert.alert(
            '🆘 Send SOS Alert',
            `This will send an automatic emergency SMS to ${usersWithPhones} nearby users with phone numbers.\n\nAll ${nearbyUsers.length} users will be alerted in the app.\n\nAre you sure you want to proceed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send SOS',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await sendSOSToNearby(`🆘 EMERGENCY! I need help immediately!`, userName);
                        if (result.success) {
                            Alert.alert(
                                'SOS Sent Successfully!', 
                                `Alert sent to ${result.recipientCount} nearby users\nAutomatic SMS sent to ${result.smsCount} users\n\nHelp is on the way!`
                            );
                        } else {
                            Alert.alert('Error', result.error || 'Could not send SOS');
                        }
                    },
                },
            ]
        );
    };

    const saveUserProfile = async () => {
        if (!userName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        await AsyncStorage.setItem('nyra_userName', userName);
        await AsyncStorage.setItem('nyra_phoneNumber', phoneNumber);
        setShowProfileDialog(false);
        Alert.alert('Profile Saved', 'Your profile has been saved successfully!');
    };

    const handleContactUser = (user) => {
        const distanceText = user.distance < 1000 
            ? `${user.distance}m` 
            : `${(user.distance / 1000).toFixed(1)}km`;
        
        Alert.alert(
            `📍 ${user.name}`,
            `Distance: ${distanceText} away\nStatus: ${user.status.toUpperCase()}\nAccuracy: ±${Math.round(user.accuracy)}m\n${user.phoneNumber ? `Phone: ${user.phoneNumber}` : ''}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: '📱 Send Alert SMS',
                    onPress: () => handleSendAlertToUser(user),
                },
                {
                    text: '🗺️ View on Map',
                    onPress: () => openUserLocation(user),
                },
            ]
        );
    };

    const handleSendAlertToUser = async (user) => {
        const defaultMessage = `🚨 ALERT! I need assistance! I'm ${user.distance < 1000 ? `${user.distance}m` : `${(user.distance / 1000).toFixed(1)}km`} away from you.`;
        
        // Send SMS automatically without confirmation (like panic button)
        const result = await sendAlertToUser(user, defaultMessage, userName);
        
        if (result.success) {
            Alert.alert(
                '✅ Alert Sent!', 
                result.sentViaAutomatic 
                    ? `Emergency SMS automatically sent to ${user.name}` 
                    : `SMS sent to ${user.name}`
            );
        } else {
            Alert.alert('❌ Error', result.error || 'Could not send alert');
        }
    };

    const openUserLocation = (user) => {
        const url = `https://maps.google.com/?q=${user.latitude},${user.longitude}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open maps');
            }
        });
    };

    const getDistanceLabel = (distance) => {
        if (distance < 1000) {
            return `${Math.round(distance)}m away`;
        } else {
            return `${(distance / 1000).toFixed(1)}km away`;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'safe':
                return '#4CAF50';
            case 'alert':
                return '#FF9800';
            case 'emergency':
                return '#F44336';
            default:
                return '#9E9E9E';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={loadNearbyUsers}
                        enabled={isSharing}
                    />
                }
            >
                {/* Header */}
                <Animatable.View animation="fadeInDown" style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text variant="headlineMedium" style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
                                NYRA Community 🌐
                            </Text>
                            <Text variant="bodyMedium" style={[styles.subtitle, { color: isDarkMode ? '#b0b0b0' : theme.colors.onSurfaceVariant }]}>
                                Connect with nearby NYRA users
                            </Text>
                        </View>
                        <IconButton
                            icon="account-edit"
                            size={24}
                            iconColor={theme.colors.primary}
                            onPress={() => setShowProfileDialog(true)}
                        />
                    </View>
                </Animatable.View>

                {/* Location Sharing Toggle */}
                <Animatable.View animation="fadeInUp" delay={200}>
                    <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
                        <Card.Content>
                            <View style={styles.sharingRow}>
                                <View style={styles.sharingInfo}>
                                    <Text variant="titleMedium" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                        Location Sharing
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: isDarkMode ? '#b0b0b0' : 'grey', marginTop: 4 }}>
                                        {isSharing ? 'You are visible to nearby users' : 'Enable to find nearby NYRA users'}
                                    </Text>
                                </View>
                                <Switch value={isSharing} onValueChange={handleToggleSharing} />
                            </View>

                            {isSharing && (
                                <View style={styles.rangeSelector}>
                                    <Text variant="bodyMedium" style={{ color: isDarkMode ? '#fff' : '#000', marginTop: 16 }}>
                                        Range: {maxDistance < 1000 ? `${maxDistance} m` : `${maxDistance / 1000} km`}
                                    </Text>
                                    <View style={styles.rangeButtons}>
                                        <Chip
                                            selected={maxDistance === 500}
                                            onPress={() => setMaxDistance(500)}
                                            style={styles.chip}
                                        >
                                            500m
                                        </Chip>
                                        <Chip
                                            selected={maxDistance === 1000}
                                            onPress={() => setMaxDistance(1000)}
                                            style={styles.chip}
                                        >
                                            1km
                                        </Chip>
                                        <Chip
                                            selected={maxDistance === 2000}
                                            onPress={() => setMaxDistance(2000)}
                                            style={styles.chip}
                                        >
                                            2km
                                        </Chip>
                                    </View>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                </Animatable.View>

                {/* Nearby Users Count */}
                {isSharing && (
                    <Animatable.View animation="fadeInUp" delay={400}>
                        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
                            <Card.Content>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
                                            {nearbyUsers.length}
                                        </Text>
                                        <Text variant="bodyMedium" style={{ color: isDarkMode ? '#b0b0b0' : 'grey' }}>
                                            Nearby Users
                                        </Text>
                                    </View>
                                    <Button
                                        mode="contained"
                                        icon="refresh"
                                        onPress={loadNearbyUsers}
                                        loading={isLoading}
                                        disabled={isLoading}
                                    >
                                        Refresh
                                    </Button>
                                </View>
                            </Card.Content>
                        </Card>
                    </Animatable.View>
                )}

                {/* SOS Button */}
                {isSharing && nearbyUsers.length > 0 && (
                    <Animatable.View animation="pulse" delay={600}>
                        <Button
                            mode="contained"
                            icon="alert-circle"
                            onPress={handleSendSOS}
                            style={[styles.sosButton, { backgroundColor: theme.colors.error }]}
                            labelStyle={styles.sosButtonLabel}
                        >
                            Send SOS to Nearby Users
                        </Button>
                    </Animatable.View>
                )}

                {/* Nearby Users List */}
                {isSharing && nearbyUsers.length > 0 && (
                    <Animatable.View animation="fadeInUp" delay={800}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                            Nearby NYRA Users
                        </Text>
                        {nearbyUsers.map((user, index) => (
                            <Animatable.View
                                key={user.id}
                                animation="fadeInRight"
                                delay={900 + index * 100}
                            >
                                <Card style={[styles.userCard, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
                                    <Card.Content>
                                        <View style={styles.userRow}>
                                            <Avatar.Text size={48} label={user.name.charAt(0)} />
                                            <View style={styles.userInfo}>
                                                <Text variant="titleMedium" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                                    {user.name}
                                                </Text>
                                                <Text variant="bodySmall" style={{ color: isDarkMode ? '#b0b0b0' : 'grey' }}>
                                                    {getDistanceLabel(user.distance)}
                                                </Text>
                                                {user.phoneNumber && (
                                                    <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
                                                        📱 {user.phoneNumber}
                                                    </Text>
                                                )}
                                                {user.accuracy && (
                                                    <Text variant="bodySmall" style={{ color: isDarkMode ? '#888' : '#999', marginTop: 2 }}>
                                                        📍 Accuracy: ±{Math.round(user.accuracy)}m
                                                    </Text>
                                                )}
                                                <View style={styles.statusRow}>
                                                    <View
                                                        style={[
                                                            styles.statusIndicator,
                                                            { backgroundColor: getStatusColor(user.status) },
                                                        ]}
                                                    />
                                                    <Text
                                                        variant="bodySmall"
                                                        style={{ color: getStatusColor(user.status), marginLeft: 4 }}
                                                    >
                                                        {user.status.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <IconButton
                                                icon="phone-message"
                                                size={24}
                                                iconColor={theme.colors.primary}
                                                onPress={() => handleContactUser(user)}
                                            />
                                        </View>
                                    </Card.Content>
                                </Card>
                            </Animatable.View>
                        ))}
                    </Animatable.View>
                )}

                {/* Empty State */}
                {isSharing && nearbyUsers.length === 0 && !isLoading && (
                    <Animatable.View animation="fadeIn" style={styles.emptyState}>
                        <Text style={{ fontSize: 60, marginBottom: 16 }}>🔍</Text>
                        <Text variant="titleMedium" style={[styles.emptyStateText, { color: isDarkMode ? '#fff' : '#000' }]}>
                            No NYRA Users Nearby
                        </Text>
                        <Text variant="bodyMedium" style={[styles.emptyStateSubtext, { color: isDarkMode ? '#b0b0b0' : 'grey' }]}>
                            Try increasing your range or check back later
                        </Text>
                    </Animatable.View>
                )}

                {/* Disabled State */}
                {!isSharing && (
                    <Animatable.View animation="fadeIn" style={styles.emptyState}>
                        <Text style={{ fontSize: 60, marginBottom: 16 }}>📍</Text>
                        <Text variant="titleMedium" style={[styles.emptyStateText, { color: isDarkMode ? '#fff' : '#000' }]}>
                            Location Sharing Disabled
                        </Text>
                        <Text variant="bodyMedium" style={[styles.emptyStateSubtext, { color: isDarkMode ? '#b0b0b0' : 'grey' }]}>
                            Enable location sharing to connect with nearby NYRA users
                        </Text>
                    </Animatable.View>
                )}

                {/* Info Card */}
                <Card style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1e1e1e' : theme.colors.surfaceVariant }]}>
                    <Card.Content>
                        <Text variant="titleSmall" style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: 8 }}>
                            💡 How it works
                        </Text>
                        <Text variant="bodySmall" style={{ color: isDarkMode ? '#b0b0b0' : theme.colors.onSurfaceVariant }}>
                            • Enable location sharing to be visible to other NYRA users{'\n'}
                            • Nearby users within your selected range will appear in real-time{'\n'}
                            • Click on any user to view their location on the map{'\n'}
                            • Send automatic alert SMS to specific users by tapping the message icon{'\n'}
                            • Use SOS button to send automatic emergency SMS to all nearby users{'\n'}
                            • Distance accuracy is enhanced with GPS validation (±accuracy shown){'\n'}
                            • Your privacy is protected - only active NYRA users can see your location
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* Profile Setup Dialog */}
            <Portal>
                <Dialog
                    visible={showProfileDialog}
                    onDismiss={() => setShowProfileDialog(false)}
                    style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }}
                >
                    <Dialog.Title style={{ color: isDarkMode ? '#fff' : '#000' }}>
                        Setup Your Profile
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ color: isDarkMode ? '#b0b0b0' : '#666', marginBottom: 16 }}>
                            Your name and phone number will be shared with nearby NYRA users for emergency contact.
                        </Text>
                        <TextInput
                            label="Your Name"
                            value={userName}
                            onChangeText={setUserName}
                            mode="outlined"
                            style={{ marginBottom: 12, backgroundColor: isDarkMode ? '#2e2e2e' : '#fff' }}
                            textColor={isDarkMode ? '#fff' : '#000'}
                            placeholder="Enter your name"
                        />
                        <TextInput
                            label="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={{ backgroundColor: isDarkMode ? '#2e2e2e' : '#fff' }}
                            textColor={isDarkMode ? '#fff' : '#000'}
                            placeholder="+1234567890"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowProfileDialog(false)}>Cancel</Button>
                        <Button onPress={saveUserProfile} mode="contained">Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
    },
    sharingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sharingInfo: {
        flex: 1,
    },
    rangeSelector: {
        marginTop: 8,
    },
    rangeButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        marginRight: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    sosButton: {
        marginVertical: 16,
        borderRadius: 12,
        paddingVertical: 8,
    },
    sosButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        marginVertical: 16,
        fontWeight: '600',
    },
    userCard: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 1,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    emptyStateText: {
        marginBottom: 8,
    },
    emptyStateSubtext: {
        textAlign: 'center',
    },
    infoCard: {
        marginTop: 24,
        marginBottom: 16,
        borderRadius: 12,
    },
});
