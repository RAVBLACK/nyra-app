"""
Convert trained model to TensorFlow.js format for React Native
"""

import os
import tensorflow as tf
import tensorflowjs as tfjs

# Paths
INPUT_MODEL = 'output/activity_recognition_model.h5'
OUTPUT_DIR = '../assets/models'

def convert_model():
    """Convert Keras model to TensorFlow.js format"""
    
    print("🔄 Converting model to TensorFlow.js format...")
    
    # Load the Keras model
    if not os.path.exists(INPUT_MODEL):
        print(f"❌ Model file not found: {INPUT_MODEL}")
        print("Please train the model first using train_activity_model.py")
        return False
    
    print(f"📂 Loading model from {INPUT_MODEL}")
    model = tf.keras.models.load_model(INPUT_MODEL)
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Convert to TensorFlow.js format
    print(f"💾 Converting to TensorFlow.js format...")
    tfjs.converters.save_keras_model(model, OUTPUT_DIR)
    
    print(f"✅ Model converted successfully!")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print(f"📦 Files created:")
    for file in os.listdir(OUTPUT_DIR):
        file_path = os.path.join(OUTPUT_DIR, file)
        if os.path.isfile(file_path):
            size_kb = os.path.getsize(file_path) / 1024
            print(f"   - {file} ({size_kb:.2f} KB)")
    
    print("\n✨ Next steps:")
    print("1. The model is now in: assets/models/")
    print("2. React Native will load it using tf.loadLayersModel()")
    print("3. Restart your app: npx expo start --clear")
    
    return True

if __name__ == '__main__':
    success = convert_model()
    exit(0 if success else 1)
