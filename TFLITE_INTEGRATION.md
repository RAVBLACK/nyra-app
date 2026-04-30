# TensorFlow Lite Integration Guide

## Overview
This guide shows how to integrate the trained TFLite activity recognition model into your React Native app.

## Step 1: Install Dependencies

```bash
npm install @tensorflow/tfjs
npm install @tensorflow/tfjs-react-native
npm install react-native-fs
```

For Android, also install:
```bash
npm install react-native-tflite
```

Or use the Expo-compatible approach with Expo modules.

## Step 2: Add Model to Assets

1. Copy your trained model:
```bash
cp ml-training/output/activity_model.tflite android/app/src/main/assets/
cp ml-training/output/activity_model.tflite ios/
```

2. For React Native, you can also bundle it in your JS assets.

## Step 3: Create TFLite Service

Create `services/tfliteModelService.js` (provided in the repo).

## Step 4: Update HAR Model Service

Replace the rule-based detection in `harModelService.js` with TFLite predictions.

### Before (Rule-based):
```javascript
predictActivity(sensorData) {
  const { ax, ay, az, gx, gy, gz, svm } = sensorData;
  // Manual thresholds...
  if (svm < BASE_MOVEMENT_THRESHOLD_IDLE) {
    return 'IDLE';
  }
  // ... more rules
}
```

### After (ML-based):
```javascript
import { predictActivity } from './tfliteModelService';

async predictActivity(sensorData) {
  this.sensorDataBuffer.push(sensorData);
  
  if (this.sensorDataBuffer.length >= WINDOW_SIZE) {
    const prediction = await predictActivity(this.sensorDataBuffer);
    
    latestActivityState = {
      name: prediction.activity,
      confidence: prediction.confidence,
      isProtectionActive: this.isMonitoring,
      anomaly: null,
    };
    
    notifyListeners();
    
    // Slide the window
    this.sensorDataBuffer = this.sensorDataBuffer.slice(STEP_SIZE);
  }
}
```

## Step 5: Model Loading Strategy

### Option A: Load from Assets (Recommended for Production)
```javascript
import RNFS from 'react-native-fs';

const modelPath = Platform.select({
  android: `${RNFS.MainBundlePath}/assets/activity_model.tflite`,
  ios: `${RNFS.MainBundlePath}/activity_model.tflite`,
});
```

### Option B: Load from Remote URL (For Updates)
```javascript
const modelUrl = 'https://your-cdn.com/models/activity_model.tflite';
const localPath = `${RNFS.DocumentDirectoryPath}/activity_model.tflite`;

// Download once
if (!(await RNFS.exists(localPath))) {
  await RNFS.downloadFile({
    fromUrl: modelUrl,
    toFile: localPath,
  }).promise;
}
```

## Step 6: Android Configuration

Add to `android/app/build.gradle`:

```gradle
android {
    aaptOptions {
        noCompress "tflite"
    }
}

dependencies {
    implementation 'org.tensorflow:tensorflow-lite:2.14.0'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
}
```

## Step 7: iOS Configuration

Add to your Podfile:
```ruby
pod 'TensorFlowLiteSwift'
```

Then run:
```bash
cd ios && pod install
```

## Step 8: Feature Preprocessing

Ensure your sensor data matches the training format:

```javascript
function preprocessSensorData(sensorBuffer) {
  // Extract features
  const features = sensorBuffer.map(sample => {
    const { ax, ay, az } = sample;
    const svm = Math.sqrt(ax**2 + ay**2 + az**2);
    return [ax, ay, az, svm];
  });
  
  // Normalize (use same scaler parameters from training)
  const normalized = normalizeFeatures(features);
  
  return normalized;
}
```

## Step 9: Activity Mapping

Map model outputs to your app's activity labels:

```javascript
const ACTIVITY_MAP = {
  0: 'WALKING',
  1: 'RUNNING',  // Jogging
  2: 'WALKING',  // Upstairs
  3: 'WALKING',  // Downstairs
  4: 'IDLE',     // Sitting
  5: 'STANDING',
};
```

## Step 10: Testing

Test the model with real sensor data:

```javascript
// In ActivityDetectionScreen.js
const testModelButton = (
  <Button
    mode="contained"
    onPress={async () => {
      const result = await testTFLiteModel();
      console.log('Model test result:', result);
    }}
  >
    Test TFLite Model
  </Button>
);
```

## Performance Optimization

### 1. Batching
Process multiple windows together:
```javascript
const predictions = await model.predict([window1, window2, window3]);
```

### 2. Threading
Use a separate thread for inference:
```javascript
import { Worker } from 'react-native-workers';

const worker = new Worker('./modelWorker.js');
worker.postMessage({ sensorData: buffer });
```

### 3. Caching
Cache recent predictions to reduce inference calls:
```javascript
const predictionCache = new Map();
```

## Troubleshooting

### Issue: Model not loading
- Check file path and permissions
- Verify model file size (should be ~500KB)
- Check Android assets folder

### Issue: Wrong predictions
- Verify sensor data preprocessing
- Check normalization parameters
- Ensure sampling rate matches training (10Hz)

### Issue: Slow inference
- Enable GPU delegate on Android
- Reduce window size
- Use quantized model

## Advanced: Fall Detection

Add anomaly detection for falls:

```javascript
function detectFall(sensorData, prediction) {
  const { svm } = sensorData;
  
  // Sudden high acceleration
  if (svm > 30 && prediction.activity !== 'RUNNING') {
    return {
      type: 'FALL',
      confidence: 0.9,
      timestamp: Date.now(),
    };
  }
  
  return null;
}
```

## Model Updates

To update the model without app release:

1. Host model on CDN
2. Implement version checking
3. Download new model in background
4. Swap models atomically

```javascript
async function updateModel(newVersion) {
  const newModelPath = await downloadModel(newVersion);
  await loadModel(newModelPath);
  await AsyncStorage.setItem('modelVersion', newVersion);
}
```

## Monitoring

Track model performance in production:

```javascript
import analytics from '@react-native-firebase/analytics';

analytics().logEvent('activity_prediction', {
  activity: prediction.activity,
  confidence: prediction.confidence,
  inference_time_ms: inferenceTime,
});
```

## Next Steps

1. Train your model with the training script
2. Convert to TFLite format
3. Integrate using the provided service
4. Test with real-world data
5. Fine-tune confidence thresholds
6. Deploy to production

## Resources

- [TensorFlow Lite Guide](https://www.tensorflow.org/lite)
- [React Native TFLite](https://github.com/shaqian/react-native-tensorflow-lite)
- [WISDM Dataset](https://www.cis.fordham.edu/wisdm/dataset.php)
