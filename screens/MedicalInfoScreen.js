import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Switch, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { medicalService } from '../services/medicalService';

export default function MedicalInfoScreen() {
    const theme = useTheme();
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');
    const [medications, setMedications] = useState('');
    const [conditions, setConditions] = useState('');
    const [emergencyNotes, setEmergencyNotes] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMedicalInfo();
    }, []);

    const loadMedicalInfo = async () => {
        const info = await medicalService.loadMedicalInfo();
        if (info) {
            setBloodType(info.bloodType || '');
            setAllergies(info.allergies || '');
            setMedications(info.medications || '');
            setConditions(info.conditions || '');
            setEmergencyNotes(info.emergencyNotes || '');
            setShowNotification(info.showNotification || false);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const medicalInfo = {
            bloodType,
            allergies,
            medications,
            conditions,
            emergencyNotes,
            showNotification,
        };

        const success = await medicalService.saveMedicalInfo(medicalInfo);

        if (success) {
            if (showNotification) {
                await medicalService.showMedicalNotification(medicalInfo);
            } else {
                await medicalService.hideMedicalNotification();
            }

            Alert.alert(
                '✅ Saved',
                'Medical information saved successfully',
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert(
                '❌ Error',
                'Failed to save medical information',
                [{ text: 'OK' }]
            );
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Medical Info',
            'Are you sure you want to delete all medical information?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await medicalService.deleteMedicalInfo();
                        setBloodType('');
                        setAllergies('');
                        setMedications('');
                        setConditions('');
                        setEmergencyNotes('');
                        setShowNotification(false);
                        Alert.alert('Deleted', 'Medical information deleted');
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text variant="headlineMedium" style={styles.title}>
                    🏥 Medical Information
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    This information will be shown to first responders in emergencies
                </Text>

                <TextInput
                    label="Blood Type"
                    value={bloodType}
                    onChangeText={setBloodType}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., A+, B-, O+, AB+"
                />

                <TextInput
                    label="Allergies"
                    value={allergies}
                    onChangeText={setAllergies}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., Penicillin, Peanuts"
                    multiline
                    numberOfLines={2}
                />

                <TextInput
                    label="Current Medications"
                    value={medications}
                    onChangeText={setMedications}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., Aspirin, Insulin"
                    multiline
                    numberOfLines={2}
                />

                <TextInput
                    label="Medical Conditions"
                    value={conditions}
                    onChangeText={setConditions}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., Diabetes, Asthma"
                    multiline
                    numberOfLines={2}
                />

                <TextInput
                    label="Emergency Notes"
                    value={emergencyNotes}
                    onChangeText={setEmergencyNotes}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Any other important information"
                    multiline
                    numberOfLines={3}
                />

                <View style={styles.switchContainer}>
                    <View style={styles.switchText}>
                        <Text variant="titleMedium">Show Persistent Notification</Text>
                        <Text variant="bodySmall" style={styles.switchSubtext}>
                            Display medical info on lock screen (recommended)
                        </Text>
                    </View>
                    <Switch
                        value={showNotification}
                        onValueChange={setShowNotification}
                    />
                </View>

                <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.saveButton}
                    icon="content-save"
                >
                    Save Medical Information
                </Button>

                <Button
                    mode="outlined"
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    textColor={theme.colors.error}
                >
                    Delete All Information
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    title: {
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 24,
        opacity: 0.7,
    },
    input: {
        marginBottom: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    switchText: {
        flex: 1,
        marginRight: 16,
    },
    switchSubtext: {
        marginTop: 4,
        opacity: 0.6,
    },
    saveButton: {
        marginTop: 8,
        marginBottom: 12,
    },
    deleteButton: {
        marginBottom: 32,
    },
});
