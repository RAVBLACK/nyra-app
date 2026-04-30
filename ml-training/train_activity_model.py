"""
TensorFlow LSTM Model for Human Activity Recognition
Optimized for smartphone accelerometer + gyroscope data
Dataset: WISDM or UCI HAR
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import matplotlib.pyplot as plt
import os

# Configuration
WINDOW_SIZE = 100  # Number of samples per window (2.5 seconds at 40Hz)
STEP_SIZE = 50     # Overlap of 50%
EPOCHS = 50
BATCH_SIZE = 64

# Activity labels mapping
ACTIVITIES = {
    'Walking': 0,
    'Jogging': 1,  # Running
    'Upstairs': 2,
    'Downstairs': 3,
    'Sitting': 4,
    'Standing': 5
}

def load_wisdm_data(filepath='data/WISDM_ar_v1.1_raw.txt'):
    """
    Load and parse WISDM dataset
    Format: user,activity,timestamp,x,y,z
    """
    print("Loading WISDM dataset...")
    
    # Read the data
    column_names = ['user', 'activity', 'timestamp', 'x', 'y', 'z']
    df = pd.read_csv(filepath, header=None, names=column_names)
    
    # Clean the data (WISDM has semicolons at the end)
    df['z'] = df['z'].apply(lambda x: str(x).replace(';', ''))
    df['z'] = pd.to_numeric(df['z'], errors='coerce')
    
    # Remove any rows with NaN
    df = df.dropna()
    
    print(f"Loaded {len(df)} samples")
    print(f"Activities: {df['activity'].unique()}")
    print(f"Users: {df['user'].nunique()}")
    
    return df

def create_windows(df, window_size=WINDOW_SIZE, step_size=STEP_SIZE):
    """
    Create overlapping windows from time series data
    """
    print("Creating time windows...")
    
    windows = []
    labels = []
    
    # Group by user and activity for proper windowing
    for (user, activity), group in df.groupby(['user', 'activity']):
        data = group[['x', 'y', 'z']].values
        
        # Create overlapping windows
        for i in range(0, len(data) - window_size, step_size):
            window = data[i:i + window_size]
            if len(window) == window_size:
                # Add derived features
                # Calculate SVM (Signal Vector Magnitude)
                svm = np.sqrt(np.sum(window ** 2, axis=1, keepdims=True))
                
                # Concatenate original features with SVM
                window_with_features = np.concatenate([window, svm], axis=1)
                
                windows.append(window_with_features)
                labels.append(activity)
    
    windows = np.array(windows)
    labels = np.array(labels)
    
    print(f"Created {len(windows)} windows")
    print(f"Window shape: {windows.shape}")
    
    return windows, labels

def build_lstm_model(input_shape, num_classes):
    """
    Build LSTM-based model for activity recognition
    """
    model = keras.Sequential([
        # First LSTM layer
        keras.layers.LSTM(64, return_sequences=True, input_shape=input_shape),
        keras.layers.Dropout(0.2),
        
        # Second LSTM layer
        keras.layers.LSTM(64, return_sequences=False),
        keras.layers.Dropout(0.2),
        
        # Dense layers
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.2),
        
        # Output layer
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def plot_training_history(history):
    """
    Plot training and validation accuracy/loss
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Accuracy plot
    ax1.plot(history.history['accuracy'], label='Training Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)
    
    # Loss plot
    ax2.plot(history.history['loss'], label='Training Loss')
    ax2.plot(history.history['val_loss'], label='Validation Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    plt.savefig('output/training_history.png')
    print("Training history saved to output/training_history.png")

def main():
    # Create output directory
    os.makedirs('output', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    print("=" * 60)
    print("TensorFlow LSTM Activity Recognition Model Training")
    print("=" * 60)
    
    # Check if data exists
    data_path = 'data/WISDM_ar_v1.1_raw.txt'
    if not os.path.exists(data_path):
        print("\n⚠️  WISDM dataset not found!")
        print("Please download from: https://www.cis.fordham.edu/wisdm/dataset.php")
        print(f"Place the file at: {data_path}")
        print("\nAlternatively, download UCI HAR dataset and modify the loading function.")
        return
    
    # Load data
    df = load_wisdm_data(data_path)
    
    # Create windows
    X, y = create_windows(df)
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    print(f"\nClass distribution:")
    unique, counts = np.unique(y_encoded, return_counts=True)
    for label_idx, count in zip(unique, counts):
        activity_name = label_encoder.inverse_transform([label_idx])[0]
        print(f"  {activity_name}: {count} windows ({count/len(y_encoded)*100:.1f}%)")
    
    # Normalize features
    print("\nNormalizing features...")
    n_samples, n_timesteps, n_features = X.shape
    X_reshaped = X.reshape(-1, n_features)
    
    scaler = StandardScaler()
    X_normalized = scaler.fit_transform(X_reshaped)
    X_normalized = X_normalized.reshape(n_samples, n_timesteps, n_features)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_normalized, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    print(f"\nTraining samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Build model
    print("\nBuilding LSTM model...")
    model = build_lstm_model(
        input_shape=(X_train.shape[1], X_train.shape[2]),
        num_classes=len(ACTIVITIES)
    )
    
    model.summary()
    
    # Callbacks
    early_stopping = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )
    
    reduce_lr = keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-7
    )
    
    # Train model
    print("\nTraining model...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=[early_stopping, reduce_lr],
        verbose=1
    )
    
    # Evaluate
    print("\nEvaluating model...")
    test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Accuracy: {test_accuracy*100:.2f}%")
    print(f"Test Loss: {test_loss:.4f}")
    
    # Save model
    model_path = 'output/activity_recognition_model.h5'
    model.save(model_path)
    print(f"\n✅ Model saved to {model_path}")
    
    # Save scaler and label encoder
    import pickle
    with open('output/scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    with open('output/label_encoder.pkl', 'wb') as f:
        pickle.dump(label_encoder, f)
    print("✅ Scaler and label encoder saved")
    
    # Plot training history
    plot_training_history(history)
    
    # Detailed evaluation
    from sklearn.metrics import classification_report, confusion_matrix
    
    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(
        y_test, y_pred_classes,
        target_names=label_encoder.classes_
    ))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred_classes)
    print("\nConfusion Matrix:")
    print(cm)
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print(f"Next step: Run 'python convert_to_tflite.py' to convert for mobile")

if __name__ == '__main__':
    main()
