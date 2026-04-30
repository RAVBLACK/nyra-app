import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { AlertIcon } from './SvgIcons';

const pulse = {
  0: { transform: [{ scale: 1 }], opacity: 1 },
  0.5: { transform: [{ scale: 1.1 }], opacity: 0.7 },
  1: { transform: [{ scale: 1 }], opacity: 1 },
};

export default function PanicButton({ onPress, compact = false }) {
  const theme = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  const size = compact ? 90 : 140;
  const iconSize = compact ? 36 : 54;
  const fontSize = compact ? 14 : 20;

  return (
    <Animatable.View animation={pulse} iterationCount="infinite" duration={1500}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.errorContainer,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <AlertIcon size={iconSize} color={theme.colors.onErrorContainer} />
        <Text style={[styles.text, { color: theme.colors.onErrorContainer, fontSize }]}>PANIC</Text>
      </TouchableOpacity>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontWeight: 'bold',
    marginTop: 2,
  },
});