# 🧪 How to Test the ML Model

## Quick Test Methods

### Method 1: Check Console Logs (Easiest)

**What to look for:**

When you open your app, check the Metro bundler console for these logs:

```
✅ WORKING:
🤖 Initializing ML activity recognition model...
🔧 Initializing TensorFlow.js for React Native...
✅ TensorFlow.js backend ready: cpu
✅ Model initialized successfully
✅ ML model ready for predictions

❌ NOT WORKING:
⚠️ Model not ready, initializing...
❌ Error initializing model: [error message]
```

### Method 2: Add Test Button to Activity Detection Screen

1. **Open:** `screens/ActivityDetectionScreen.js`

2. **Add import at top:**
```javascript
import tfliteService from '../services/tfliteModelService';
```

3. **Add this button inside your screen (before the closing `</View>`):**
```javascript
<Button
  mode="contained"
  onPress={async () => {
    try {
      // Initialize ML model
      const ready = await tfliteService.initialize();
      
      if (!ready) {
        alert('❌ ML Model not ready');
        return;
      }
      
      // Test with dummy data
      const dummyData = Array(25).fill(null).map(() => ({
        ax: Math.random() * 2 - 1,
        ay: Math.random() * 2 - 1,
        az: 9.8 + Math.random() * 0.5,
      }));
      
      const prediction = await tfliteService.predict(dummyData);
      
      alert(
        `✅ ML Working!\n\n` +
        `Activity: ${prediction.activity}\n` +
        `Confidence: ${(prediction.confidence * 100).toFixed(1)}%\n` +
        `Time: ${prediction.inferenceTimeMs}ms`
      );
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  }}
  style={{ marginTop: 20 }}
>
  🧪 Test ML Model
</Button>
```

4. **Tap the button** - You'll see a popup with the prediction!

### Method 3: Watch Real-Time Predictions

**In Metro console, you'll see:**
```
🎯 ML Prediction: WALKING (87.3%) in 12ms
🎯 ML Prediction: IDLE (94.2%) in 11ms
🎯 ML Prediction: RUNNING (89.5%) in 13ms
```

These appear when:
- You enable Protection Mode
- The app is detecting your activity
- Sensor data is being processed

### Method 4: Check Model Info

**Add to ActivityDetectionScreen.js:**
```javascript
import { getModelInfo } from '../services/tfliteModelService';

// Inside a button or useEffect:
const info = getModelInfo();
console.log('ML Model Info:', info);
// Output: { isReady: true, inputShape: [...], ... }
```

---

## ✅ How to Know It's Working

### Signs ML is Active:

1. **Console Log:** `✅ ML model ready for predictions`
2. **Faster Updates:** Activities change more smoothly
3. **Better Accuracy:** More consistent activity detection
4. **Confidence Scores:** Higher confidence (>80%) on predictions
5. **Inference Time:** Logs show prediction time (10-20ms)

### Signs ML is NOT Active (Using Fallback):

1. **Console Log:** `⚠️ ML prediction failed, falling back to rule-based`
2. **No TensorFlow logs** during startup
3. **Activities based on threshold rules** (less smooth)

---

## 🎯 Current Status Check

Run this in Metro console or browser console:

```javascript
// Check if TensorFlow.js loaded
console.log('TensorFlow loaded:', typeof tf !== 'undefined');

// Check model service
import('./services/tfliteModelService').then(m => {
  console.log('Model ready:', m.default.isReady);
  console.log('Model info:', m.getModelInfo());
});
```

---

## 📊 Real-World Testing

### Test Scenario 1: Walking Detection

1. Enable Protection Mode
2. Walk around with your phone
3. Check Activity Detection screen
4. Should show: **WALKING** with 80%+ confidence

**Expected Console:**
```
🎯 ML Prediction: WALKING (87%) in 12ms
```

### Test Scenario 2: Idle/Standing

1. Put phone on desk or hold still
2. Should show: **IDLE** or **STANDING**
3. Confidence should be 85%+

**Expected Console:**
```
🎯 ML Prediction: IDLE (92%) in 11ms
```

### Test Scenario 3: Running

1. Jog or run with phone
2. Should show: **RUNNING** with 85%+ confidence

**Expected Console:**
```
🎯 ML Prediction: RUNNING (89%) in 13ms
```

---

## 🐛 Troubleshooting

### Not seeing ML logs?

**Check:**
1. Is app running? (`npx expo start`)
2. Check Metro bundler console (not device console)
3. Look for TensorFlow initialization errors
4. Try restarting: `npx expo start --clear`

### Seeing errors?

**Common issues:**
```
❌ Cannot find module '@tensorflow/tfjs'
→ Run: npm install --legacy-peer-deps

❌ expo-gl not found
→ Run: npx expo install expo-gl

❌ Model not initializing
→ Check console for specific error
→ App will fallback to rule-based (still works!)
```

### Want to force rule-based?

In `harModelService.js`, change:
```javascript
const ML_ENABLED = false; // Disable ML temporarily
```

---

## 🎓 Performance Metrics

### What to Expect:

| Metric | Target | Meaning |
|--------|--------|---------|
| Inference Time | 10-20ms | Fast enough for real-time |
| Confidence | >75% | Model is confident |
| Accuracy | 75-80% (sample data) | Basic model working |
| Accuracy | 95%+ (trained data) | Full model (after training) |

---

## ✅ Quick Verification Checklist

- [ ] App starts without errors
- [ ] See "TensorFlow.js backend ready" in console
- [ ] See "ML model ready for predictions" in console
- [ ] Test button shows ML prediction popup
- [ ] Real-time predictions in console logs
- [ ] Activity Detection screen updates smoothly
- [ ] No crashes or freezing

If all checked ✅ → **ML Model is working!** 🎉

---

## 🚀 Next Steps

1. **Test with real movement** - Walk, run, sit
2. **Check accuracy** - Does it match your activity?
3. **Monitor performance** - Inference time < 20ms?
4. **Optional:** Train with real WISDM data for 95%+ accuracy

**The model is working if you can predict activities without errors!**
