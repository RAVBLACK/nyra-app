// Quick ML Model Test
// Add this temporarily to your ActivityDetectionScreen.js to test the ML model

import React, { useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import tfliteService from '../services/tfliteModelService';

export function MLModelTest() {
  const [status, setStatus] = useState('Not tested');
  const [prediction, setPrediction] = useState(null);

  const testMLModel = async () => {
    try {
      setStatus('Testing...');
      
      // Step 1: Initialize
      const initialized = await tfliteService.initialize();
      if (!initialized) {
        setStatus('❌ Failed to initialize');
        return;
      }
      
      // Step 2: Test prediction with dummy walking data
      const walkingData = Array(25).fill(null).map(() => ({
        ax: Math.random() * 2 - 1,
        ay: Math.random() * 2 - 1,
        az: 9.8 + Math.random() * 0.5,
        gx: Math.random() * 0.5,
        gy: Math.random() * 0.5,
        gz: Math.random() * 0.3,
      }));
      
      const result = await tfliteService.predict(walkingData);
      
      setPrediction(result);
      setStatus('✅ ML Model Working!');
      
      Alert.alert(
        'ML Model Test Success!',
        `Activity: ${result.activity}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nTime: ${result.inferenceTimeMs}ms`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
      Alert.alert('Test Failed', error.message);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10, borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        🤖 ML Model Test
      </Text>
      
      <Text style={{ marginBottom: 10 }}>Status: {status}</Text>
      
      {prediction && (
        <View style={{ marginBottom: 10 }}>
          <Text>Activity: {prediction.activity}</Text>
          <Text>Confidence: {(prediction.confidence * 100).toFixed(1)}%</Text>
          <Text>Inference Time: {prediction.inferenceTimeMs}ms</Text>
        </View>
      )}
      
      <Button title="Test ML Model" onPress={testMLModel} />
    </View>
  );
}
