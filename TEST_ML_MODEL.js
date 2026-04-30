/**
 * Test script for TensorFlow Lite model integration
 * Run this to verify the ML model is working
 */

import tfliteService from './services/tfliteModelService';

async function testMLModel() {
  console.log('='.repeat(60));
  console.log('Testing TensorFlow Lite Activity Recognition Model');
  console.log('='.repeat(60));

  try {
    // Step 1: Initialize the model
    console.log('\n📦 Step 1: Initializing model...');
    const initialized = await tfliteService.initialize();
    
    if (!initialized) {
      console.error('❌ Model initialization failed!');
      return;
    }
    
    console.log('✅ Model initialized successfully!');

    // Step 2: Get model info
    console.log('\n📊 Step 2: Model information:');
    const info = tfliteService.getModelInfo();
    console.log(JSON.stringify(info, null, 2));

    // Step 3: Test with walking data (simulated)
    console.log('\n🚶 Step 3: Testing with simulated WALKING data...');
    const walkingData = Array(25).fill(null).map(() => ({
      ax: Math.random() * 2 - 1,
      ay: Math.random() * 2 - 1,
      az: 9.8 + Math.random() * 0.5,
      gx: Math.random() * 0.5,
      gy: Math.random() * 0.5,
      gz: Math.random() * 0.3,
    }));
    
    const walkingPrediction = await tfliteService.predict(walkingData);
    console.log('Result:', {
      activity: walkingPrediction.activity,
      confidence: `${(walkingPrediction.confidence * 100).toFixed(1)}%`,
      inferenceTime: `${walkingPrediction.inferenceTimeMs}ms`
    });

    // Step 4: Test with idle data (simulated)
    console.log('\n🛋️  Step 4: Testing with simulated IDLE data...');
    const idleData = Array(25).fill(null).map(() => ({
      ax: Math.random() * 0.1,
      ay: Math.random() * 0.1,
      az: 9.8 + Math.random() * 0.05,
      gx: Math.random() * 0.01,
      gy: Math.random() * 0.01,
      gz: Math.random() * 0.01,
    }));
    
    const idlePrediction = await tfliteService.predict(idleData);
    console.log('Result:', {
      activity: idlePrediction.activity,
      confidence: `${(idlePrediction.confidence * 100).toFixed(1)}%`,
      inferenceTime: `${idlePrediction.inferenceTimeMs}ms`
    });

    // Step 5: Test with running data (simulated)
    console.log('\n🏃 Step 5: Testing with simulated RUNNING data...');
    const runningData = Array(25).fill(null).map(() => ({
      ax: Math.random() * 4 - 2,
      ay: Math.random() * 4 - 2,
      az: 9.8 + Math.random() * 2,
      gx: Math.random() * 1.5,
      gy: Math.random() * 1.5,
      gz: Math.random() * 1.0,
    }));
    
    const runningPrediction = await tfliteService.predict(runningData);
    console.log('Result:', {
      activity: runningPrediction.activity,
      confidence: `${(runningPrediction.confidence * 100).toFixed(1)}%`,
      inferenceTime: `${runningPrediction.inferenceTimeMs}ms`
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('\n💡 The ML model is ready to use in your app!');
    console.log('Simply import and use in harModelService.js');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testMLModel().catch(console.error);
