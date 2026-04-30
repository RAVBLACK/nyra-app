"""
Dataset Download Helper
Downloads and prepares datasets for activity recognition training
"""

import urllib.request
import os
import zipfile
import gzip
import shutil
import ssl

def download_wisdm():
    """
    Download WISDM dataset with multiple fallback URLs
    """
    print("=" * 60)
    print("Downloading WISDM Dataset")
    print("=" * 60)
    
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    
    # Multiple URLs to try (ordered by reliability)
    urls = [
        # Direct download from archive
        "https://archive.ics.uci.edu/static/public/507/wisdm+smartphone+and+smartwatch+activity+and+biometrics+dataset.zip",
        # Kaggle mirror (if available)
        "https://www.cis.fordham.edu/wisdm/includes/datasets/latest/WISDM_ar_latest.tar.gz",
        # GitHub mirror
        "https://github.com/uguraba/WISDM-dataset/raw/master/WISDM_ar_v1.1_raw.txt",
    ]
    
    # Try each URL
    for i, url in enumerate(urls):
        try:
            print(f"\n📥 Trying download method {i+1}...")
            print(f"URL: {url}")
            
            # Create SSL context that doesn't verify certificates (for some servers)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            if url.endswith('.txt'):
                # Direct text file
                output_file = os.path.join(data_dir, "WISDM_ar_v1.1_raw.txt")
                urllib.request.urlretrieve(url, output_file)
                print("✅ Download complete!")
                print(f"📊 Data file: {output_file}")
                return True
                
            elif url.endswith('.zip'):
                # ZIP file
                output_file = os.path.join(data_dir, "wisdm.zip")
                urllib.request.urlretrieve(url, output_file)
                print("✅ Download complete!")
                
                # Extract
                print("\nExtracting files...")
                with zipfile.ZipFile(output_file, 'r') as zip_ref:
                    zip_ref.extractall(data_dir)
                
                print("✅ Extraction complete!")
                
                # Find the data file
                for root, dirs, files in os.walk(data_dir):
                    for file in files:
                        if file.endswith('.txt') and 'raw' in file.lower():
                            found_file = os.path.join(root, file)
                            print(f"📊 Data file: {found_file}")
                            
                            # Copy to standard location
                            standard_path = os.path.join(data_dir, "WISDM_ar_v1.1_raw.txt")
                            if found_file != standard_path:
                                shutil.copy(found_file, standard_path)
                                print(f"📋 Copied to: {standard_path}")
                            return True
                
            elif url.endswith('.tar.gz'):
                # TAR.GZ file
                output_file = os.path.join(data_dir, "WISDM_ar_latest.tar.gz")
                urllib.request.urlretrieve(url, output_file)
                print("✅ Download complete!")
                
                # Extract
                print("\nExtracting files...")
                import tarfile
                with tarfile.open(output_file, 'r:gz') as tar:
                    tar.extractall(data_dir)
                
                print("✅ Extraction complete!")
                
                # Find the data file
                for root, dirs, files in os.walk(data_dir):
                    for file in files:
                        if file.endswith('.txt') and 'raw' in file.lower():
                            found_file = os.path.join(root, file)
                            print(f"📊 Data file: {found_file}")
                            
                            # Copy to standard location
                            standard_path = os.path.join(data_dir, "WISDM_ar_v1.1_raw.txt")
                            if found_file != standard_path:
                                shutil.copy(found_file, standard_path)
                                print(f"📋 Copied to: {standard_path}")
                            return True
                            
        except Exception as e:
            print(f"❌ Method {i+1} failed: {e}")
            continue
    
    # All methods failed - provide manual instructions
    print("\n" + "=" * 60)
    print("⚠️  AUTOMATIC DOWNLOAD FAILED")
    print("=" * 60)
    print("\n📝 Please download WISDM dataset manually:")
    print("\nOption 1 (Recommended - UCI Repository):")
    print("1. Visit: https://archive.ics.uci.edu/dataset/507/wisdm+smartphone+and+smartwatch+activity+and+biometrics+dataset")
    print("2. Click 'Download' button")
    print("3. Extract the downloaded file")
    print("4. Find 'WISDM_ar_v1.1_raw.txt' or similar")
    print(f"5. Copy it to: {os.path.abspath(data_dir)}/WISDM_ar_v1.1_raw.txt")
    
    print("\nOption 2 (Fordham University):")
    print("1. Visit: https://www.cis.fordham.edu/wisdm/dataset.php")
    print("2. Download 'Actitracker' dataset")
    print("3. Extract and find the raw .txt file")
    print(f"4. Copy it to: {os.path.abspath(data_dir)}/WISDM_ar_v1.1_raw.txt")
    
    print("\nOption 3 (GitHub Mirror):")
    print("1. Visit: https://github.com/uguraba/WISDM-dataset")
    print("2. Download 'WISDM_ar_v1.1_raw.txt'")
    print(f"3. Copy it to: {os.path.abspath(data_dir)}/WISDM_ar_v1.1_raw.txt")
    
    print("\nOption 4 (Use Sample Data):")
    print("Run: python create_sample_dataset.py")
    print("This creates a small sample for testing (not for production)")
    
    return False

def download_uci_har():
    """
    Download UCI HAR dataset
    """
    print("=" * 60)
    print("Downloading UCI HAR Dataset")
    print("=" * 60)
    
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00240/UCI%20HAR%20Dataset.zip"
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    
    output_file = os.path.join(data_dir, "UCI_HAR_Dataset.zip")
    
    print(f"Downloading from: {url}")
    print(f"Saving to: {output_file}")
    
    try:
        urllib.request.urlretrieve(url, output_file)
        print("✅ Download complete!")
        
        # Extract
        print("\nExtracting files...")
        with zipfile.ZipFile(output_file, 'r') as zip_ref:
            zip_ref.extractall(data_dir)
        
        print("✅ Extraction complete!")
        print(f"\nDataset ready in: {data_dir}/UCI HAR Dataset/")
        
        return True
    except Exception as e:
        print(f"❌ Error downloading UCI HAR: {e}")
        print("\n⚠️ Please download manually from:")
        print("https://archive.ics.uci.edu/ml/datasets/Human+Activity+Recognition+Using+Smartphones")
        return False

def list_datasets():
    """
    List available datasets in data directory
    """
    data_dir = "data"
    
    if not os.path.exists(data_dir):
        print("No data directory found.")
        return
    
    print("\n" + "=" * 60)
    print("Available Datasets")
    print("=" * 60)
    
    for item in os.listdir(data_dir):
        item_path = os.path.join(data_dir, item)
        if os.path.isfile(item_path):
            size_mb = os.path.getsize(item_path) / (1024 * 1024)
            print(f"📄 {item} ({size_mb:.2f} MB)")
        elif os.path.isdir(item_path):
            print(f"📁 {item}/")

def main():
    print("Dataset Download Helper")
    print("=" * 60)
    print("\nAvailable datasets:")
    print("1. WISDM (Recommended)")
    print("2. UCI HAR")
    print("3. List existing datasets")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == '1':
        download_wisdm()
    elif choice == '2':
        download_uci_har()
    elif choice == '3':
        list_datasets()
    elif choice == '4':
        print("Exiting...")
        return
    else:
        print("Invalid choice!")
    
    print("\n" + "=" * 60)
    print("Next Steps:")
    print("=" * 60)
    print("1. Verify the dataset files are in the data/ directory")
    print("2. Run: python train_activity_model.py")

if __name__ == '__main__':
    main()
