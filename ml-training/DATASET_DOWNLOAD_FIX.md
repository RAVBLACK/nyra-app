# WISDM Dataset Download Guide

## Problem: WISDM Website Has Changed

The WISDM dataset website structure has changed and direct downloads may not work. Here are **multiple ways** to get the dataset:

## ✅ SOLUTION 1: Manual Download from UCI (RECOMMENDED)

**This is the most reliable method:**

1. **Visit UCI Repository:**
   - Go to: https://archive.ics.uci.edu/dataset/507/wisdm+smartphone+and+smartwatch+activity+and+biometrics+dataset

2. **Download the Dataset:**
   - Click the blue **"Download"** button
   - File will be named something like `wisdm+smartphone+and+smartwatch+activity+and+biometrics+dataset.zip`

3. **Extract the File:**
   - Unzip the downloaded file
   - Look for `WISDM_ar_v1.1_raw.txt` or similar raw data file

4. **Place in Correct Location:**
   - Copy the `.txt` file to: `ml-training/data/WISDM_ar_v1.1_raw.txt`
   - Make sure the filename is exactly: `WISDM_ar_v1.1_raw.txt`

## ✅ SOLUTION 2: Try Automatic Download

Run the improved download script:

```bash
cd ml-training
python download_dataset.py
```

Choose option 1 and it will try multiple sources automatically.

## ✅ SOLUTION 3: GitHub Mirror

1. Visit: https://github.com/uguraba/WISDM-dataset
2. Download `WISDM_ar_v1.1_raw.txt` directly
3. Place in `ml-training/data/WISDM_ar_v1.1_raw.txt`

## ✅ SOLUTION 4: Create Sample Data (For Testing Only)

If you just want to **test** the training pipeline:

```bash
cd ml-training
python create_sample_dataset.py
```

**⚠️ Warning:** This creates synthetic data - NOT suitable for production! Only use for testing the pipeline.

## ✅ SOLUTION 5: Use UCI HAR Dataset Instead

Alternative dataset that works well:

```bash
cd ml-training
python download_dataset.py
# Choose option 2 (UCI HAR)
```

Then modify `train_activity_model.py` to use UCI format.

## Verify Dataset is Ready

After downloading, verify the file:

```bash
cd ml-training
dir data
```

You should see: `WISDM_ar_v1.1_raw.txt` (about 50-70 MB)

## File Format Expected

The file should look like this:
```
33,Jogging,49105962326000,-5.012288,-11.264028,0.95342046;
33,Jogging,49106062271000,-5.105427,-11.446746,1.0980726;
...
```

Format: `user,activity,timestamp,x,y,z;`

## Train Your Model

Once the dataset is in place:

```bash
python train_activity_model.py
```

## Troubleshooting

### "File not found" error
- Make sure the file is named exactly: `WISDM_ar_v1.1_raw.txt`
- Make sure it's in the `ml-training/data/` folder
- Check the path is: `D:\S-nyra-innerveX\innerveX-hack\ml-training\data\WISDM_ar_v1.1_raw.txt`

### Download fails
- Use manual download (Solution 1) - most reliable
- Or use sample data for testing (Solution 4)

### Need help?
- The sample dataset creator shows you the expected format
- You can inspect the generated file to understand the structure

## Quick Commands Reference

```bash
# Navigate to ml-training
cd D:\S-nyra-innerveX\innerveX-hack\ml-training

# Create sample data (for testing)
python create_sample_dataset.py

# Or download real data
python download_dataset.py

# Train model
python train_activity_model.py

# Convert to TFLite
python convert_to_tflite.py
```

## What You'll Get

After successful training:
- `output/activity_recognition_model.h5` (~2-5 MB)
- `output/activity_model.tflite` (~500 KB)
- `output/training_history.png`
- `output/scaler.pkl`
- `output/label_encoder.pkl`

All files are automatically created in the `output/` directory.
