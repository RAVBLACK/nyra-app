import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, Portal, Dialog, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ContactsEmptyIcon } from '../components/SvgIcons';
import EmergencyContactCard from '../components/EmergencyContactCard';
import ErrorState from '../components/ErrorState';
import { useContacts } from '../hooks/useContacts';
import { useDarkMode } from '../contexts/DarkModeContext';
import * as Animatable from 'react-native-animatable';

export default function ContactsScreen() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const { contacts, addContact, removeContact, isLoading, error, retry } = useContacts();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const showDialog = () => setIsDialogVisible(true);
  const hideDialog = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setFormErrors({});
    setIsDialogVisible(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\+?\d{10,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number (at least 10 digits).";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddContact = () => {
    if (!validateForm()) {
      return;
    }

    const newContact = {
      // The hook will add the ID
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    };

    if (addContact(newContact)) {
      hideDialog();
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      `Delete ${contact.name}?`,
      `Are you sure you want to remove ${contact.name} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeContact(contact.id) }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F0F4FF' }]}>
        <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
        <Text style={{ marginTop: 10 }}>Loading contacts...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F0F4FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={[styles.title, { color: isDarkMode ? '#fff' : '#1a1a2e' }]}>Emergency Contacts</Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: isDarkMode ? '#b0b0b0' : '#6b7280' }]}>
            Add up to 5 trusted people who will be alerted in an emergency.
          </Text>
        </View>

        {contacts.length === 0 ? (
          <Animatable.View animation="fadeIn" style={styles.emptyStateContainer}>
            <ContactsEmptyIcon size={80} color={isDarkMode ? '#555' : '#c0c0c0'} />
            <Text style={[styles.emptyStateText, { color: isDarkMode ? '#888' : 'grey' }]}>
              No contacts yet.
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#666' : 'darkgrey' }]}>
              Tap the + button to get started.
            </Text>
          </Animatable.View>
        ) : (
          <View style={styles.listContainer}>
            {contacts.map((contact, index) => (
              <EmergencyContactCard
                key={contact.id}
                index={index}
                name={contact.name}
                phone={contact.phone}
                relationship={contact.relationship}
                onDelete={() => handleDeleteContact(contact)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {contacts.length < 5 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={showDialog}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      {contacts.length >= 5 && (
        <View style={styles.limitContainer}>
          <Text style={[styles.limitText, { color: isDarkMode ? '#888' : 'grey' }]}>You've reached the contact limit (Max 5).</Text>
        </View>
      )}

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={hideDialog} style={{backgroundColor: isDarkMode ? '#1e1e1e' : theme.colors.surface}}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Dialog.Title style={{ color: isDarkMode ? '#fff' : '#1a1a2e' }}>New Contact</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                error={!!formErrors.name}
              />
              <HelperText type="error" visible={!!formErrors.name}>
                {formErrors.name}
              </HelperText>

              <TextInput
                label="Phone Number *"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                error={!!formErrors.phone}
              />
              <HelperText type="error" visible={!!formErrors.phone}>
                {formErrors.phone}
              </HelperText>

              <TextInput
                label="Relationship (e.g., Mother, Friend)"
                value={relationship}
                onChangeText={setRelationship}
                mode="outlined"
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Cancel</Button>
              <Button onPress={handleAddContact}>Save</Button>
            </Dialog.Actions>
          </KeyboardAvoidingView>
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
    paddingBottom: 100, // Space for the FAB
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: -0.3,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    marginBottom: 0, // HelperText will provide spacing
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  limitContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  limitText: {
    fontSize: 12,
  },
});